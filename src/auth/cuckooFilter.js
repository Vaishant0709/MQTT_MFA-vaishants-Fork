const { CuckooFilter } = require('cuckoo-filter');
const crypto = require('crypto');

class AuthenticationFilter {
  constructor() {
    // Initialize with reasonable capacity and false positive rate
    this.filter = new CuckooFilter(1000000, 0.01);
    this.deviceCredentials = new Map(); // Store additional device info
  }

  hashCredential(deviceId, secret) {
    // Create a unique hash of the device credentials
    return crypto.createHash('sha256').update(`${deviceId}:${secret}`).digest('hex');
  }

  registerDevice(deviceId, secret, metadata = {}) {
    const hashedCredential = this.hashCredential(deviceId, secret);
    const success = this.filter.add(hashedCredential);
    
    if (success) {
      this.deviceCredentials.set(deviceId, {
        hashedCredential,
        metadata,
        lastActive: Date.now()
      });
      return true;
    }
    
    return false;
  }

  validateDevice(deviceId, secret) {
    const hashedCredential = this.hashCredential(deviceId, secret);
    return this.filter.contains(hashedCredential);
  }

  updateDeviceStatus(deviceId, status) {
    if (this.deviceCredentials.has(deviceId)) {
      const device = this.deviceCredentials.get(deviceId);
      device.lastActive = Date.now();
      device.status = status;
      return true;
    }
    return false;
  }

  getDeviceInfo(deviceId) {
    return this.deviceCredentials.get(deviceId);
  }
}

module.exports = new AuthenticationFilter();
