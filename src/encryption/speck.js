
import crypto from 'crypto';
import { performance } from 'perf_hooks';
import { logMetric } from '../utils/metricLogger.js';


class SpeckCipher {
  constructor(key) {
    // Store original key for debugging
    this.originalKey = key;

    // 1. Derive a consistent 16-byte (128-bit) key
    const keyBytes = crypto.createHash('sha256')
      .update(typeof key === 'string' ? key : JSON.stringify(key))
      .digest();
    
    // Speck-128/128 uses a 128-bit key (16 bytes)
    this.key = keyBytes.slice(0, 16);

    // 2. Pre-compute the 32 Round Keys (Key Schedule)
    this.roundKeys = this._generateRoundKeys(this.key);
    
    // console.log(`\n\x1b[33mSpeck-128 Cipher initialized.\x1b[0m`);
  }

  /**
   * Speck-128/128 Key Schedule
   * Generates 32 round keys from the main key
   */
  _generateRoundKeys(keyBuffer) {
    const mask = 0xFFFFFFFFFFFFFFFFn;
    const T = 32; // 32 Rounds
    const keys = new BigUint64Array(T);
    
    // Read key as two 64-bit integers (BigInt)
    // k[0] is lower 8 bytes, k[1] is upper 8 bytes
    let k = keyBuffer.readBigUInt64LE(0);
    let l = keyBuffer.readBigUInt64LE(8);

    keys[0] = k;

    for (let i = 0; i < T - 1; i++) {
      // l[i+1] = (RoundKey(l[i], 8) + k[i]) ^ i
      let rorL = (l >> 8n) | (l << (64n - 8n)); // Rotate Right 8
      l = ((rorL & mask) + k) & mask;
      l = l ^ BigInt(i);
      
      // k[i+1] = RotateLeft(k[i], 3) ^ l[i+1]
      let rolK = (k << 3n) | (k >> (64n - 3n)); // Rotate Left 3
      k = (rolK & mask) ^ l;

      keys[i + 1] = k;
    }

    return keys;
  }

  /**
   * Speck Block Encryption (One 128-bit block)
   * x, y are 64-bit BigInts (The block split in half)
   */
  _encryptBlock(x, y) {
    const mask = 0xFFFFFFFFFFFFFFFFn;
    
    for (let i = 0; i < 32; i++) {
      // x = (RotateRight(x, 8) + y) ^ k
      let rorX = (x >> 8n) | (x << (64n - 8n));
      x = ((rorX & mask) + y) & mask;
      x = x ^ this.roundKeys[i];

      // y = RotateLeft(y, 3) ^ x
      let rolY = (y << 3n) | (y >> (64n - 3n));
      y = (rolY & mask) ^ x;
    }
    return [x, y];
  }

  encrypt(plaintext) {
    const start = performance.now();
    try {
      const textToEncrypt = typeof plaintext === 'string' 
        ? plaintext 
        : JSON.stringify(plaintext);
      
      const buffer = Buffer.from(textToEncrypt, 'utf8');
      
      // 1. Generate IV (Nonce) - 16 bytes (128 bits)
      const iv = crypto.randomBytes(16);
      
      // 2. Prepare for CTR (Counter) Mode
      // We will treat the IV as two 64-bit integers (Counter)
      let ctrHigh = iv.readBigUInt64LE(8);
      let ctrLow = iv.readBigUInt64LE(0);
      
      const outputBuffer = Buffer.alloc(buffer.length);
      const mask = 0xFFFFFFFFFFFFFFFFn;

      // 3. Process data in 16-byte chunks (CTR Mode)
      // In CTR mode, we encrypt the Counter, then XOR with Plaintext
      for (let i = 0; i < buffer.length; i += 16) {
        // Encrypt the current counter value
        const [encHigh, encLow] = this._encryptBlock(ctrHigh, ctrLow);
        
        // XOR Key Stream with Plaintext
        for (let j = 0; j < 16 && i + j < buffer.length; j++) {
          const byteKey = j < 8 
            ? Number((encLow >> BigInt(j * 8)) & 0xFFn) 
            : Number((encHigh >> BigInt((j - 8) * 8)) & 0xFFn);
          
          outputBuffer[i + j] = buffer[i + j] ^ byteKey;
        }

        // Increment Counter
        ctrLow = (ctrLow + 1n) & mask;
        if (ctrLow === 0n) ctrHigh = (ctrHigh + 1n) & mask;
      }

      const encryptedHex = outputBuffer.toString('hex');
      const ivHex = iv.toString('hex');

      // 4. Manual Integrity Check (HMAC-SHA256)
      // Since Speck is just a cipher, we manually add an integrity tag
      // to keep your "Tampering Attack" simulation working.
      const hmac = crypto.createHmac('sha256', this.key);
      hmac.update(ivHex + ':' + encryptedHex);
      const authTag = hmac.digest('hex');

      const end = performance.now();
      // console.log(`\x1b[35m🔐 Speck Encryption Cost: ${(end - start).toFixed(3)}ms\x1b[0m`);
      // [LOG METRIC]
      logMetric('CRYPTO', 'Encryption_Time', (end - start).toFixed(4), 'Speck128');
      // Return: IV : Ciphertext : AuthTag
      return `${ivHex}:${encryptedHex}:${authTag}`;

    } catch (error) {
      console.error('\x1b[31mSpeck Encryption error:\x1b[0m', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(ciphertext) {
    const start = performance.now();
    try {
      if (!ciphertext || typeof ciphertext !== 'string') {
        throw new Error('Invalid ciphertext');
      }

      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid format. Expected IV:Data:Tag');
      }

      const ivHex = parts[0];
      const encryptedHex = parts[1];
      const receivedTag = parts[2];

      // 1. Verify Integrity (HMAC Check)
      const hmac = crypto.createHmac('sha256', this.key);
      hmac.update(ivHex + ':' + encryptedHex);
      const calculatedTag = hmac.digest('hex');

      // Constant-time comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(Buffer.from(receivedTag, 'hex'), Buffer.from(calculatedTag, 'hex'))) {
        throw new Error('Unsupported state or unable to authenticate data');
      }

      // 2. Decrypt using CTR Mode
      // (CTR decryption is identical to encryption: XOR with the same key stream)
      const iv = Buffer.from(ivHex, 'hex');
      const buffer = Buffer.from(encryptedHex, 'hex');
      const outputBuffer = Buffer.alloc(buffer.length);
      
      let ctrHigh = iv.readBigUInt64LE(8);
      let ctrLow = iv.readBigUInt64LE(0);
      const mask = 0xFFFFFFFFFFFFFFFFn;

      for (let i = 0; i < buffer.length; i += 16) {
        const [encHigh, encLow] = this._encryptBlock(ctrHigh, ctrLow);
        
        for (let j = 0; j < 16 && i + j < buffer.length; j++) {
          const byteKey = j < 8 
            ? Number((encLow >> BigInt(j * 8)) & 0xFFn) 
            : Number((encHigh >> BigInt((j - 8) * 8)) & 0xFFn);
          
          outputBuffer[i + j] = buffer[i + j] ^ byteKey;
        }

        ctrLow = (ctrLow + 1n) & mask;
        if (ctrLow === 0n) ctrHigh = (ctrHigh + 1n) & mask;
      }

      const end = performance.now();
      console.log(`\x1b[36m🔓 Speck Decryption Cost: ${(end - start).toFixed(3)}ms\x1b[0m`);
      logMetric('CRYPTO', 'Decryption_Time', (end - start).toFixed(4), 'Speck128');

      return outputBuffer.toString('utf8');

    } catch (error) {
      const end = performance.now();
      // console.error('\x1b[31mDecryption failed:\x1b[0m', error.message);
      // [LOG METRIC]
      logMetric('CRYPTO', 'Decryption_Time', (end - start).toFixed(4), 'Integrity_Failure');
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

export default SpeckCipher;




//AES 128 GCM

// import crypto from 'crypto';
// import { performance } from 'perf_hooks';
// class SpeckCipher {
//   constructor(key) {
//     // Store original key for debugging
//     this.originalKey = key;
    
//     // Create a consistent 16-byte key from any input
//     const keyBytes = crypto.createHash('sha256')
//       .update(typeof key === 'string' ? key : JSON.stringify(key))
//       .digest();
      
//     // Take exactly 16 bytes for AES-128
//     this.key = keyBytes.slice(0, 16);
    
//     // Debug output
//     // console.log(`\n\x1b[33mCipher initialized with key fingerprint: ${this.key.toString('hex').substring(0, 8)}...\x1b[0m`);
//   }

//   encrypt(plaintext) {
//     const start = performance.now(); // [START TIMER]
//     try {
//       // Ensure plaintext is a string
//       const textToEncrypt = typeof plaintext === 'string' 
//         ? plaintext 
//         : JSON.stringify(plaintext);
        
//       // Generate random IV (12 bytes is standard for GCM, though 16 works too)
//       const iv = crypto.randomBytes(12); // GCM prefers 12-byte IVs for performance
      
//       // [CHANGE 1] Use 'aes-128-gcm' instead of 'cbc'
//       const cipher = crypto.createCipheriv('aes-128-gcm', this.key, iv);
      
//       // Encrypt the data
//       let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
//       encrypted += cipher.final('hex');
      
//       // [CHANGE 2] Get the Authentication Tag (The "Integrity Seal")
//       const authTag = cipher.getAuthTag();

//       const end = performance.now(); // [END TIMER]

      
//       // [CHANGE 3] Format as IV:EncryptedData:AuthTag
//       return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
      
//     } catch (error) {
//       console.error('\x1b[31mEncryption error:\x1b[0m', error);
//       throw new Error(`Encryption failed: ${error.message}`);
//     }
//   }

//   decrypt(ciphertext) {
//     const start = performance.now(); // [START TIMER]
//     try {
      
//       // Validate input
//       if (!ciphertext || typeof ciphertext !== 'string') {
//         throw new Error('Invalid ciphertext: must be a non-empty string');
//       }
      
//       // [CHANGE 4] Split into 3 parts: IV, Data, and Tag
//       const parts = ciphertext.split(':');
      
//       if (parts.length !== 3) {
//         throw new Error(`Invalid ciphertext format (found ${parts.length} parts, expected 3)`);
//       }
      
//       // Extract IV, encrypted data, and the Auth Tag
//       const iv = Buffer.from(parts[0], 'hex');
//       const encrypted = parts[1];
//       const authTag = Buffer.from(parts[2], 'hex'); // The seal to check
      
//       // Create decipher
//       const decipher = crypto.createDecipheriv('aes-128-gcm', this.key, iv);
      
//       // [CHANGE 5] Set the Auth Tag BEFORE decrypting
//       // If the data was tampered with, decipher.final() will throw an error
//       decipher.setAuthTag(authTag);
      
//       // Decrypt the data
//       let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//       decrypted += decipher.final('utf8');
      
//       const end = performance.now(); // [STOP TIMER]
//        console.log(`\x1b[36m🔓 Decryption Cost: ${(end - start).toFixed(3)}ms\x1b[0m`);

//       return decrypted;
      
//     } catch (error) {
//       // If GCM detects tampering, it throws a specific error here
//       // console.error('\x1b[31mDecryption error (Integrity Check Failed):\x1b[0m', error.message);
//       throw new Error(`Decryption failed: ${error.message}`);
//     }
//   }
// }

// export default SpeckCipher;





// //AES 128 CBC 

// // import crypto from 'crypto';

// // class SpeckCipher {
// //   constructor(key) {
// //     // Store original key for debugging
// //     this.originalKey = key;
    
// //     // Create a consistent 16-byte key from any input
// //     const keyBytes = crypto.createHash('sha256')
// //       .update(typeof key === 'string' ? key : JSON.stringify(key))
// //       .digest();
      
// //     // Take exactly 16 bytes for AES-128
// //     this.key = keyBytes.slice(0, 16);
    
// //     // Debug output
// //     console.log(`\n\x1b[33mCipher initialized with key fingerprint: ${this.key.toString('hex').substring(0, 8)}...\x1b[0m`);
// //   }

// //   encrypt(plaintext) {
// //     try {
// //       // Ensure plaintext is a string
// //       const textToEncrypt = typeof plaintext === 'string' 
// //         ? plaintext 
// //         : JSON.stringify(plaintext);
      
// //       // Generate random IV for this encryption
// //       const iv = crypto.randomBytes(16);
      
// //       // Create cipher with our key and IV
// //       const cipher = crypto.createCipheriv('aes-128-cbc', this.key, iv);
      
// //       // Encrypt the data
// //       let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
// //       encrypted += cipher.final('hex');
      
// //       // Format as IV:encryptedData
// //       return `${iv.toString('hex')}:${encrypted}`;
// //     } catch (error) {
// //       console.error('\x1b[31mEncryption error:\x1b[0m', error);
// //       throw new Error(`Encryption failed: ${error.message}`);
// //     }
// //   }

// //   decrypt(ciphertext) {
// //     try {
// //       // Validate input
// //       if (!ciphertext || typeof ciphertext !== 'string') {
// //         throw new Error('Invalid ciphertext: must be a non-empty string');
// //       }
      
// //       // Split the ciphertext into IV and encrypted data
// //       const parts = ciphertext.split(':');
      
// //       if (parts.length !== 2) {
// //         throw new Error(`Invalid ciphertext format (found ${parts.length} parts)`);
// //       }
      
// //       // Extract IV and encrypted data
// //       const iv = Buffer.from(parts[0], 'hex');
// //       const encrypted = parts[1];
      
// //       // Validate IV length
// //       if (iv.length !== 16) {
// //         throw new Error(`Invalid IV length: ${iv.length} (expected 16)`);
// //       }
      
// //       // Create decipher with same key and the extracted IV
// //       const decipher = crypto.createDecipheriv('aes-128-cbc', this.key, iv);
      
// //       // Decrypt the data
// //       let decrypted = decipher.update(encrypted, 'hex', 'utf8');
// //       decrypted += decipher.final('utf8');
      
// //       return decrypted;
// //     } catch (error) {
// //       console.error('\x1b[31mDecryption error:\x1b[0m', error);
// //       throw new Error(`Decryption failed: ${error.message}`);
// //     }
// //   }
// // }

// // export default SpeckCipher;

