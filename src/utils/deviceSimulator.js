import axios from 'axios';
import SecureMqttClient from '../mqtt/mqttClient';

class DeviceSimulator {
  constructor(deviceId, secret, serverUrl = 'http://localhost:3000') {
    this.deviceId = deviceId;
    this.secret = secret;
    this.serverUrl = serverUrl;
    this.mqttClient = null;
    this.sessionKey = null;
  }

  async register() {
    try {
      const response = await axios.post(`${this.serverUrl}/api/devices/register`, {
        deviceId: this.deviceId,
        secret: this.secret,
        metadata: {
          type: 'simulator',
          createdAt: new Date().toISOString()
        }
      });
      
      console.log('Device registered:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async authenticate() {
    try {
      // Step 1: Initiate authentication
      const initResponse = await axios.post(`${this.serverUrl}/api/auth/initiate`, {
        deviceId: this.deviceId
      });
      
      const { sessionId } = initResponse.data;
      console.log('Authentication initiated with session:', sessionId);
      
      // Step 2: Validate credentials (Factor 1)
      const credResponse = await axios.post(`${this.serverUrl}/api/auth/validate-credentials`, {
        sessionId,
        secret: this.secret
      });
      
      if (!credResponse.data.success) {
        throw new Error('Credential validation failed');
      }
      
      const { otk } = credResponse.data;
      console.log('Credentials validated, received OTK');
      
      // Step 3: Validate OTK (Factor 2)
      const otkResponse = await axios.post(`${this.serverUrl}/api/auth/validate-otk`, {
        sessionId,
        otk
      });
      
      if (!otkResponse.data.success) {
        throw new Error('OTK validation failed');
      }
      
      console.log('Authentication successful!');
      this.sessionKey = otkResponse.data.sessionKey;
      
      return otkResponse.data;
    } catch (error) {
      console.error('Authentication failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async connectMqtt() {
    if (!this.sessionKey) {
      throw new Error('Must authenticate before connecting to MQTT');
    }
    
    this.mqttClient = new SecureMqttClient(this.deviceId, this.sessionKey);
    await this.mqttClient.connect();
    
    // Subscribe to device-specific topics
    await this.mqttClient.subscribe(`device/${this.deviceId}/commands`);
    
    console.log('Connected to MQTT broker with secure session');
  }

  publishData(data) {
    if (!this.mqttClient) {
      throw new Error('MQTT client not connected');
    }
    
    const topic = `device/${this.deviceId}/data`;
    return this.mqttClient.publish(topic, data);
  }

  disconnect() {
    if (this.mqttClient) {
      this.mqttClient.disconnect();
      this.mqttClient = null;
    }
  }
}

export default DeviceSimulator;
