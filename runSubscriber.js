import SubscriberDevice from './src/utils/subscriberDevice.js';
import 'dotenv/config';
import readline from 'readline';
import fs from 'fs';
import { performance } from 'perf_hooks'; 

const DEVICE_ID = `subscriber-${Date.now().toString().slice(-4)}`;
const SECRET = 'secure-secret-123';
const LOG_FILE = 'experiment_data.csv';

// [NEW] Updated Headers to include all 5 metrics
if (!fs.existsSync(LOG_FILE)) {
  const headers = 'Sequence,Timestamp,Latency_EndToEnd,Temp,Pub_2FA_Time,Sub_2FA_Time,Encrypt_Time(Prev),Decrypt_Time\n';
  fs.writeFileSync(LOG_FILE, headers);
  console.log(`\x1b[32m[SYSTEM] Created new log file: ${LOG_FILE}\x1b[0m`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runSubscriber() {
  console.log(`\n\x1b[36m[SUBSCRIBER] Initializing Client: ${DEVICE_ID}\x1b[0m`);
  
  const subscriber = new SubscriberDevice(DEVICE_ID, SECRET);

  try {
    await subscriber.register();
    
    // Capture Subscriber 2FA time
    console.log('\x1b[36m[SUBSCRIBER] Authenticating...\x1b[0m');
    const authStart = performance.now();
    await subscriber.authenticate();
    const authEnd = performance.now();
    const subAuthDuration = (authEnd - authStart).toFixed(2);
    
    await subscriber.connectMqtt();

    rl.question('\n\x1b[36mEnter the Publisher ID to listen to: \x1b[0m', async (targetId) => {
      const publisherId = targetId.trim();
      
      if (!publisherId) {
        console.log('\x1b[31mInvalid ID. Exiting.\x1b[0m');
        process.exit(1);
      }

      console.log(`\n\x1b[36m[SUBSCRIBER] Requesting Secure Key for: ${publisherId}...\x1b[0m`);
      
      try {
        await subscriber.subscribeToDevice(publisherId);

        console.log(`\x1b[33m[LOGGING] Writing detailed metrics to ${LOG_FILE}...\x1b[0m`);

        // Message Handler
        subscriber.setMessageHandler((topic, data, metadata) => {
          const receiveTime = Date.now();
          const latency = Math.max(0, receiveTime - data.timestamp);
          
          // Extract Metrics
          const pubAuth = data.metrics?.pubAuthTime || 0;
          const encryptTime = data.metrics?.prevEncryptTime || 0;
          const decryptTime = metadata?.decryptionTime?.toFixed(4) || 0;

          // [RESTORED] Console Log for visibility
          const latColor = latency < 50 ? '\x1b[32m' : (latency < 100 ? '\x1b[33m' : '\x1b[31m');
          console.log(
            `\x1b[36m[DATA]\x1b[0m Seq:${data.sequence} | ` +
            `Temp:${data.temperature}°C | ` +
            `${latColor}Lat:${latency}ms\x1b[0m | ` +
            `Enc:${encryptTime}ms | ` +
            `Dec:${decryptTime}ms`
          );

          // CSV Log
          // Format: Seq, Time, Latency, Temp, PubAuth, SubAuth, Encrypt, Decrypt
          const csvLine = `${data.sequence},${receiveTime},${latency},${data.temperature},` + 
                          `${pubAuth},${subAuthDuration},${encryptTime},${decryptTime}\n`;
          
          try {
            fs.appendFileSync(LOG_FILE, csvLine);
          } catch (err) {
            console.error('\x1b[31m[ERROR] Failed to write to CSV:\x1b[0m', err.message);
          }
        });

      } catch (err) {
        console.error(`\x1b[31m[ERROR] Could not subscribe to ${publisherId}: ${err.message}\x1b[0m`);
      }
    });

  } catch (error) {
    console.error('\x1b[31m[SUBSCRIBER] Critical Error:\x1b[0m', error.message);
    process.exit(1);
  }
}

runSubscriber();