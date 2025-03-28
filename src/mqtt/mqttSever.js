import mqtt from 'mqtt';
import SpeckCipher from '../encryption/speck.js';
import heartbeatMonitor from '../heartbeat/monitor.js';
import { config } from 'dotenv';

config();

class MqttServer {
  constructor() {
    this.client = null;
    this.deviceSessions = new Map(); // deviceId -> { sessionKey, cipher }
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.username = process.env.MQTT_USERNAME;
    this.password = process.env.MQTT_PASSWORD;
  }

  start() {
    // Connect to MQTT broker
    this.client = mqtt.connect(this.brokerUrl, {
      clientId: `mqtt_server_${Date.now()}`,
      username: this.username,
      password: this.password,
      clean: true
    });

    this.client.on('connect', () => {
      console.log('MQTT server connected to broker');
      
      // Subscribe to all device heartbeats
      this.client.subscribe('device/+/heartbeat');
    });

    this.client.on('message', (topic, message) => {
      // Extract deviceId from topic (e.g., "device/123/heartbeat")
      const topicParts = topic.split('/');
      if (topicParts.length >= 3 && topicParts[0] === 'device' && topicParts[2] === 'heartbeat') {
        const deviceId = topicParts[1];
        
        // Decrypt message if we have a session for this device
        if (this.deviceSessions.has(deviceId)) {
          try {
            const { cipher } = this.deviceSessions.get(deviceId);
            const decryptedMessage = cipher.decrypt(message.toString());
            const heartbeatData = JSON.parse(decryptedMessage);
            
            // Record heartbeat
            heartbeatMonitor.recordHeartbeat(deviceId, heartbeatData.status);
          } catch (error) {
            console.error(`Failed to process heartbeat from ${deviceId}:`, error);
          }
        } else {
          console.warn(`Received heartbeat from unauthenticated device ${deviceId}`);
        }
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT server error:', error);
    });

    // Set up event listeners for device status changes
    heartbeatMonitor.on('deviceOffline', (deviceId) => {
      console.log(`Device ${deviceId} went offline`);
      // Implement additional security measures for unexpected disconnections
    });

    heartbeatMonitor.on('deviceOnline', (deviceId) => {
      console.log(`Device ${deviceId} came online`);
    });
  }

  registerDeviceSession(deviceId, sessionKey) {
    const cipher = new SpeckCipher(sessionKey);
    this.deviceSessions.set(deviceId, { sessionKey, cipher });
    console.log(`Registered secure session for device ${deviceId}`);
  }

  sendMessageToDevice(deviceId, topic, message) {
    if (!this.deviceSessions.has(deviceId)) {
      throw new Error(`No secure session for device ${deviceId}`);
    }
    
    const { cipher } = this.deviceSessions.get(deviceId);
    const encryptedMessage = cipher.encrypt(
      typeof message === 'string' ? message : JSON.stringify(message)
    );
    
    this.client.publish(topic, encryptedMessage);
  }
}

export default new MqttServer();
