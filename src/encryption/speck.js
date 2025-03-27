const crypto = require('crypto');

class SpeckCipher {
  constructor(key) {
    // Ensure key is exactly 16 bytes for AES-128
    this.key = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
  }

  encrypt(plaintext) {
    try {
      const iv = crypto.randomBytes(16); // Initialization vector
      const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(this.key, 'hex'), iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted; // Prepend IV to ciphertext
    } catch (error) {
      console.error('Encryption error:', error.message);
      throw new Error('Encryption failed');
    }
  }

  decrypt(ciphertext) {
    try {
      const parts = ciphertext.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(this.key, 'hex'), iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      throw new Error('Decryption failed');
    }
  }
}

module.exports = SpeckCipher;
