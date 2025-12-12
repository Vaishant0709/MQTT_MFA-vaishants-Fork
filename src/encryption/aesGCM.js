import crypto from 'crypto';
import { performance } from 'perf_hooks';

class aesCipher {
  constructor(key) {
    // Store original key for debugging
    this.originalKey = key;
    
    // Create a consistent 16-byte key from any input
    const keyBytes = crypto.createHash('sha256')
      .update(typeof key === 'string' ? key : JSON.stringify(key))
      .digest();
      
    // Take exactly 16 bytes for AES-128
    this.key = keyBytes.slice(0, 16);
    this.lastOperationDuration = 0; // [NEW] Tracks metrics for research
  }

  encrypt(plaintext) {
    const start = performance.now(); // [START TIMER]
    try {
      // Ensure plaintext is a string
      const textToEncrypt = typeof plaintext === 'string' 
        ? plaintext 
        : JSON.stringify(plaintext);
        
      // Generate random IV (12 bytes is standard for GCM)
      const iv = crypto.randomBytes(12); 
      
      const cipher = crypto.createCipheriv('aes-128-gcm', this.key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the Authentication Tag
      const authTag = cipher.getAuthTag();

      const end = performance.now(); // [END TIMER]
      this.lastOperationDuration = end - start; // [NEW] Store duration

      // Format as IV:EncryptedData:AuthTag
      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
      
    } catch (error) {
      console.error('\x1b[31mEncryption error:\x1b[0m', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(ciphertext) {
    const start = performance.now(); // [START TIMER]
    try {
      
      // Validate input
      if (!ciphertext || typeof ciphertext !== 'string') {
        throw new Error('Invalid ciphertext: must be a non-empty string');
      }
      
      // Split into 3 parts: IV, Data, and Tag
      const parts = ciphertext.split(':');
      
      if (parts.length !== 3) {
        throw new Error(`Invalid ciphertext format (found ${parts.length} parts, expected 3)`);
      }
      
      // Extract IV, encrypted data, and the Auth Tag
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex'); // The seal to check
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-128-gcm', this.key, iv);
      
      // Set the Auth Tag BEFORE decrypting
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const end = performance.now(); // [STOP TIMER]
      this.lastOperationDuration = end - start; // [NEW] Store duration

      // [RESTORED] Original console log for decryption cost
      console.log(`\x1b[36m🔓 Decryption Cost: ${(end - start).toFixed(3)}ms\x1b[0m`);

      return decrypted;
      
    } catch (error) {
      console.error('\x1b[31mDecryption error (Integrity Check Failed):\x1b[0m', error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

export default aesCipher;