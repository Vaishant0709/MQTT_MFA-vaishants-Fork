// index.js
import 'dotenv/config';
import * as server from './src/server.js';
import DeviceSimulator from './src/utils/deviceSimulator.js';
import SubscriberDevice from './src/utils/subscriberDevice.js';

// Set up devices with unique IDs
const publisherId = `publisher-${Date.now()}`;
const subscriberId = `subscriber-${Date.now()}`;
const secret = 'secure-secret-123';

// For demonstration, create publisher and subscriber devices
async function runSimulation() {
  try {
    console.log('\x1b[34m========================================================\x1b[0m');
    console.log('\x1b[34m🔐 Starting Secure MQTT Communication Simulation 🔐\x1b[0m');
    console.log('\x1b[34m========================================================\x1b[0m');

    // Set up publisher device
    console.log('\n\x1b[35m[PUBLISHER SETUP]\x1b[0m');
    const publisher = new DeviceSimulator(publisherId, secret);
    
    // Set up subscriber device
    console.log('\n\x1b[36m[SUBSCRIBER SETUP]\x1b[0m');
    const subscriber = new SubscriberDevice(subscriberId, secret);
    
    // Register devices
    await publisher.register();
    await subscriber.register();
    
    // Authenticate devices using MFA
    await publisher.authenticate();
    await subscriber.authenticate();
    
    // Connect devices to MQTT broker
    await publisher.connectMqtt();
    await subscriber.connectMqtt();
    
    // Subscribe to publisher's data
    await subscriber.subscribeToDevice(publisherId);
    
    console.log('\n\x1b[34m========================================================\x1b[0m');
    console.log('\x1b[34m🚀 Secure communication channel established! 🚀\x1b[0m');
    console.log('\x1b[34m========================================================\x1b[0m');
    
    // Set up message handler for subscriber
    subscriber.setMessageHandler((topic, data) => {
      console.log(`\x1b[32m💡 Subscriber received data: Temperature: ${data.temperature.toFixed(2)}°C, Humidity: ${data.humidity.toFixed(2)}%\x1b[0m`);
    });
    
    // Publish data periodically
    console.log('\n\x1b[33mStarting periodic data transmission...\x1b[0m');
    
    let counter = 0;
    const dataInterval = setInterval(() => {
      counter++;
      const data = {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        timestamp: Date.now(),
        messageNumber: counter
      };
      
      publisher.publishData(data);
      
      // Stop after 10 messages
      if (counter >= 5) {
        clearInterval(dataInterval);
        
        setTimeout(() => {
          console.log('\n\x1b[34m========================================================\x1b[0m');
          console.log('\x1b[34m✅ Simulation completed successfully! ✅\x1b[0m');
          console.log('\x1b[34m========================================================\x1b[0m');
          
          // Graceful shutdown
          publisher.disconnect();
          subscriber.disconnect();
          
          // Allow time for disconnection messages
          setTimeout(() => {
            process.exit(0);
          }, 1000);
        }, 1000);
      }
    }, 3000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\x1b[33mShutting down devices...\x1b[0m');
      clearInterval(dataInterval);
      publisher.disconnect();
      subscriber.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('\x1b[31mSimulation error:\x1b[0m', error);
    process.exit(1);
  }
}

// Run the simulation
runSimulation();
