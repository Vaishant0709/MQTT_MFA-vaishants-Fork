import mqtt from 'mqtt';
import SpeckCipher from '../encryption/speck.js';
import { config } from 'dotenv';

config();

class SecureMqttClient {
  constructor(deviceId, sessionKey) {
    this.deviceId = deviceId;
    this.cipher = new SpeckCipher(sessionKey);
    this.client = null;
    this.heartbeatInterval = null;
    this.connected = false;
    this.heartbeatTopic = `device/${deviceId}/heartbeat`;
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  }

  connect(options = {}) {
    return new Promise((resolve, reject) => {
      // Connect to MQTT broker
      this.client = mqtt.connect(this.brokerUrl, {
        ...options,
        clientId: `device_${this.deviceId}_${Date.now()}`
      });

      this.client.on('connect', () => {
        console.log(`Device ${this.deviceId} connected to MQTT broker`);
        this.connected = true;
        this._startHeartbeat();
        resolve(true);
      });

      this.client.on('error', (error) => {
        console.error(`MQTT connection error for device ${this.deviceId}:`, error);
        reject(error);
      });

      this.client.on('message', (topic, message) => {
        try {
          // Decrypt the message
          const decryptedMessage = this.cipher.decrypt(message.toString());
          console.log(`Received on ${topic}: ${decryptedMessage}`);
          // Handle the message here
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      });
    });
  }

  publish(topic, message) {
    if (!this.connected) {
      throw new Error('Client not connected');
    }
    
    try {
      // Encrypt the message
      const encryptedMessage = this.cipher.encrypt(
        typeof message === 'string' ? message : JSON.stringify(message)
      );
      
      // Publish the encrypted message
      this.client.publish(topic, encryptedMessage);
      return true;
    } catch (error) {
      console.error('Failed to publish message:', error);
      return false;
    }
  }

  subscribe(topic) {
    if (!this.connected) {
      throw new Error('Client not connected');
    }
    
    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`Subscribed to ${topic}`);
          resolve(true);
        }
      });
    });
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.client && this.connected) {
      this.client.end();
      this.connected = false;
      console.log(`Device ${this.deviceId} disconnected from MQTT broker`);
    }
  }

  _startHeartbeat() {
    const interval = parseInt(process.env.HEARTBEAT_INTERVAL) || 5000;
    
    this.heartbeatInterval = setInterval(() => {
      const heartbeat = {
        deviceId: this.deviceId,
        timestamp: Date.now(),
        status: 'online'
      };
      
      this.publish(this.heartbeatTopic, heartbeat);
    }, interval);
  }
}

export default SecureMqttClient;
