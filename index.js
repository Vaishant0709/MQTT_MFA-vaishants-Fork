require('dotenv').config();
const server = require('./src/server');
const DeviceSimulator = require('./src/utils/deviceSimulator');

// For demonstration, create and register a test device
async function runTestDevice() {
  try {
    const deviceId = `test-device-${Date.now()}`;
    const secret = 'test-secret-123';
    
    const device = new DeviceSimulator(deviceId, secret);
    
    // Register the device
    await device.register();
    
    // Authenticate using MFA
    await device.authenticate();
    
    // Connect to MQTT broker
    await device.connectMqtt();
    
    // Publish some test data
    setInterval(() => {
      const data = {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        timestamp: Date.now()
      };
      
      device.publishData(data);
    }, 10000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down test device...');
      device.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Test device error:', error);
  }
}

// Run the test device
runTestDevice();
