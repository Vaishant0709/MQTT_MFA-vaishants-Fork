import SubscriberDevice from './src/utils/subscriberDevice.js';
import mqtt from 'mqtt'; 
import 'dotenv/config';
import readline from 'readline';
import fs from 'fs';
import { performance } from 'perf_hooks';

const DEVICE_ID = `subscriber-${Date.now().toString().slice(-4)}`;
const SECRET = 'secure-secret-123';
const LOG_FILE = 'experiment_data.csv';

// [UPDATED] Restored headers for Crypto Latency
if (!fs.existsSync(LOG_FILE)) {
  const headers = 'Sequence,Timestamp,Latency_EndToEnd,Encrypt_Time,Decrypt_Time,Status\n';
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
    await subscriber.authenticate();
    await subscriber.connectMqtt();

    // Listen for System Alerts (Brute Force)
    if (subscriber.mqttClient && subscriber.mqttClient.client) {
        subscriber.mqttClient.client.subscribe('system/alerts');
        subscriber.mqttClient.client.on('message', (topic, msg) => {
            if (topic === 'system/alerts') {
                console.log(`\x1b[31m🚨 [SYSTEM ALERT] ${msg.toString()}\x1b[0m`);
                // Log brute force (0 latency, just attack marker)
                const csvLine = `N/A,${Date.now()},0,0,0,Attack\n`;
                fs.appendFileSync(LOG_FILE, csvLine);
            }
        });
    }

    rl.question('\n\x1b[36mEnter the Publisher ID to listen to: \x1b[0m', async (targetId) => {
      const publisherId = targetId.trim();
      if (!publisherId) process.exit(1);

      console.log(`\n\x1b[36m[SUBSCRIBER] Monitoring ${publisherId}...\x1b[0m`);
      
      try {
        await subscriber.subscribeToDevice(publisherId);

        subscriber.setMessageHandler((topic, data, metadata) => {
            const receiveTime = Date.now();
            let status = 'Success';
            let sequence = data?.sequence || 'N/A';
            
            // 1. CALCULATE LATENCY (Including for attacks)
            // Replay attacks will show >2000ms latency here (The "Spike")
            const latency = Math.max(0, receiveTime - data.timestamp);
            
            // 2. EXTRACT CRYPTO METRICS
            // prevEncryptTime comes from Publisher's payload
            const encryptTime = data.metrics?.prevEncryptTime || 0;
            // decryptionTime comes from our local measurement
            const decryptTime = metadata?.decryptionTime?.toFixed(4) || 0;

            // 3. SECURITY CHECKS
            if (data && (Date.now() - data.timestamp > 2000)) {
                status = 'Attack'; // Replay detected
                console.warn(`\x1b[31m[BLOCK] Replay/Old Packet detected. Seq: ${sequence} (Lat: ${latency}ms)\x1b[0m`);
            }
            if (data && data.temperature > 100) {
                status = 'Attack'; // Rogue Data
            }

            if (status === 'Success') {
                console.log(`\x1b[32m[DATA] Seq:${sequence} | Lat:${latency}ms | Enc:${encryptTime}ms | Dec:${decryptTime}ms\x1b[0m`);
            }

            // LOGGING
            const csvLine = `${sequence},${receiveTime},${latency},${encryptTime},${decryptTime},${status}\n`;
            fs.appendFileSync(LOG_FILE, csvLine);
        });

      } catch (err) {
        console.error(`Error: ${err.message}`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Global Error Interceptor (Tamper Detection)
const originalError = console.error;
console.error = function(...args) {
    const errorMsg = args.toString();
    if (errorMsg.includes('Decryption failed') || errorMsg.includes('Unsupported state')) {
        console.log(`\x1b[31m[BLOCK] Tampered Packet Detected\x1b[0m`);
        // Tampered packets have 0 latency/crypto stats because they failed to decrypt
        const csvLine = `N/A,${Date.now()},0,0,0,Attack\n`;
        fs.appendFileSync(LOG_FILE, csvLine);
        return; 
    }
    originalError.apply(console, args);
};

runSubscriber();