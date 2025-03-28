import { EventEmitter } from 'events';
import authFilter from '../auth/cuckooFilter';

class HeartbeatMonitor extends EventEmitter {
  constructor(timeoutInterval = 30000) {
    super();
    this.devices = new Map(); // deviceId -> last heartbeat timestamp
    this.timeoutInterval = timeoutInterval; // Time in ms before device is considered offline
    this.checkInterval = Math.min(timeoutInterval / 2, 10000); // Check interval (max 10 seconds)
    
    // Start the monitoring loop
    this._startMonitoring();
  }

  recordHeartbeat(deviceId, status = 'online') {
    const timestamp = Date.now();
    const wasOffline = this.devices.has(deviceId) && 
                      (timestamp - this.devices.get(deviceId)) > this.timeoutInterval;
    
    this.devices.set(deviceId, timestamp);
    authFilter.updateDeviceStatus(deviceId, status);
    
    if (wasOffline) {
      this.emit('deviceOnline', deviceId);
    }
    
    return { timestamp, status };
  }

  getDeviceStatus(deviceId) {
    if (!this.devices.has(deviceId)) {
      return { status: 'unknown', lastSeen: null };
    }
    
    const lastHeartbeat = this.devices.get(deviceId);
    const isOnline = (Date.now() - lastHeartbeat) <= this.timeoutInterval;
    
    return {
      status: isOnline ? 'online' : 'offline',
      lastSeen: new Date(lastHeartbeat).toISOString()
    };
  }

  _startMonitoring() {
    setInterval(() => {
      const now = Date.now();
      for (const [deviceId, lastHeartbeat] of this.devices.entries()) {
        // Check if device went offline
        const isNowOffline = (now - lastHeartbeat) > this.timeoutInterval;
        const wasPreviouslyOffline = authFilter.getDeviceInfo(deviceId)?.status === 'offline';
        
        if (isNowOffline && !wasPreviouslyOffline) {
          authFilter.updateDeviceStatus(deviceId, 'offline');
          this.emit('deviceOffline', deviceId);
        }
      }
    }, this.checkInterval);
  }
}

export default new HeartbeatMonitor();
