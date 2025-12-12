// runSubscriber.js
import SubscriberDevice from './src/utils/subscriberDevice.js'; //
import 'dotenv/config';
import readline from 'readline';

const DEVICE_ID = `subscriber-${Date.now().toString().slice(-4)}`;
const SECRET = 'secure-secret-123';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runSubscriber() {
  console.log(`\n\x1b[36m[SUBSCRIBER] Initializing Client: ${DEVICE_ID}\x1b[0m`);

  const subscriber = new SubscriberDevice(DEVICE_ID, SECRET);

  try {
    // 1. Standard Startup
    await subscriber.register();
    await subscriber.authenticate();
    await subscriber.connectMqtt();

    // 2. Interactive Menu
    rl.question('\n\x1b[36mEnter the Publisher ID to listen to: \x1b[0m', async (targetId) => {
      const publisherId = targetId.trim();
      
      if (!publisherId) {
        console.log('\x1b[31mInvalid ID. Exiting.\x1b[0m');
        process.exit(1);
      }

      console.log(`\n\x1b[36m[SUBSCRIBER] Requesting Secure Key for: ${publisherId}...\x1b[0m`);
      
      try {
        // This triggers the Key Exchange logic in subscriberDevice.js
        await subscriber.subscribeToDevice(publisherId);

        // 3. Message Handler (for metrics)
        subscriber.setMessageHandler((topic, data) => {
          const receiveTime = Date.now();
          const latency = receiveTime - data.timestamp;
          
          // Color-code latency for visibility
          const latColor = latency < 50 ? '\x1b[32m' : (latency < 200 ? '\x1b[33m' : '\x1b[31m');
          
          console.log(
            `\x1b[36m[DATA]\x1b[0m Seq: ${data.sequence} | ` +
            `Temp: ${data.temperature}°C | ` +
            `Hum: ${data.humidity}% | ` +
            `${latColor}Latency: ${latency}ms\x1b[0m`
          );
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