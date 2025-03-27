const crypto = require('crypto');

class OneTimeKeyManager {
  constructor() {
    this.activeKeys = new Map(); // deviceId -> { key, expiresAt }
    this.keyLifetime = 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  generateKey(deviceId) {
    // Generate a random 32-byte key
    const key = crypto.randomBytes(32).toString('hex');
    
    // Set expiration time
    const expiresAt = Date.now() + this.keyLifetime;
    
    // Store the key with expiration
    this.activeKeys.set(deviceId, { key, expiresAt });
    
    // Clean expired keys periodically
    this._cleanupExpiredKeys();
    
    return key;
  }

  validateKey(deviceId, providedKey) {
    if (!this.activeKeys.has(deviceId)) {
      return false;
    }
    
    const { key, expiresAt } = this.activeKeys.get(deviceId);
    
    // Check if key is expired
    if (Date.now() > expiresAt) {
      this.activeKeys.delete(deviceId);
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(key, 'hex'),
      Buffer.from(providedKey, 'hex')
    );
    
    if (isValid) {
      // Remove used key (one-time use)
      this.activeKeys.delete(deviceId);
    }
    
    return isValid;
  }

  _cleanupExpiredKeys() {
    const now = Date.now();
    for (const [deviceId, { expiresAt }] of this.activeKeys.entries()) {
      if (now > expiresAt) {
        this.activeKeys.delete(deviceId);
      }
    }
  }
}

module.exports = new OneTimeKeyManager();
