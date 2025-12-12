import DeviceSimulator from './src/utils/deviceSimulator.js';
import 'dotenv/config';

// Config
const DEVICE_ID = `publisher-${Date.now().toString().slice(-4)}`;
const SECRET = 'secure-secret-123';
const PUBLISH_INTERVAL = 3000; // 3 seconds

async function runPublisher() {
  console.log(`\n\x1b[35m[PUBLISHER] Initializing Device: ${DEVICE_ID}\x1b[0m`);

  const device = new DeviceSimulator(DEVICE_ID, SECRET);

  try {
    // 1. Registration
    console.log('\x1b[35m[PUBLISHER] Registering...\x1b[0m');
    await device.register();

    // 2. Authentication (MFA Handshake)
    console.log('\x1b[35m[PUBLISHER] Authenticating...\x1b[0m');
    await device.authenticate();

    // 3. MQTT Connection
    console.log('\x1b[35m[PUBLISHER] Connecting to MQTT...\x1b[0m');
    await device.connectMqtt();

    console.log('\x1b[35m[PUBLISHER] 🚀 Starting Data Stream...\x1b[0m');
    console.log(`\x1b[35m[INFO] COPY THIS ID FOR SUBSCRIBER: \x1b[1m${DEVICE_ID}\x1b[0m`);

    let counter = 0;
    // [NEW] Track the PREVIOUS encryption time to send in the current packet
    let lastEncryptionTime = 0;

    setInterval(async () => {
      counter++;
      
      const data = {
        temperature: (20 + Math.random() * 5).toFixed(2),
        humidity: (40 + Math.random() * 10).toFixed(2),
        timestamp: Date.now(),
        sequence: counter,
        // [NEW] Send performance metrics to Subscriber
        metrics: {
          pubAuthTime: device.authDuration.toFixed(2), // 2FA time
          prevEncryptTime: lastEncryptionTime.toFixed(4) // Encryption time of previous packet
        }
      };
      
      await device.publishData(data);
      
      // [NEW] Update the metric for the next packet
      lastEncryptionTime = device.getLastEncryptionTime();
      
      // [RESTORED] Log with details
      console.log(`\x1b[35m[PUBLISHER] Sent Message #${counter} (Encryp Time: ${lastEncryptionTime.toFixed(3)}ms)\x1b[0m`);
    }, PUBLISH_INTERVAL);

  } catch (error) {
    console.error('\x1b[31m[PUBLISHER] Critical Error:\x1b[0m', error.message);
    process.exit(1);
  }
}

runPublisher();