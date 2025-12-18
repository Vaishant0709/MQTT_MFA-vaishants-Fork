import mqtt from 'mqtt';
import 'dotenv/config';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(BROKER_URL, { clientId: 'rogue_device' });

client.on('connect', () => {
    client.subscribe('device/+/data');
});

client.on('message', (topic, message) => {
    client.unsubscribe('device/+/data');
    console.log(`\x1b[31m😈 [ATTACK] ROGUE INJECTION on ${topic}\x1b[0m`);

    // Sending RAW JSON (Unencrypted)
    // The subscriber expects "IV:Cipher:Tag". This will cause a format error.
    const payload = JSON.stringify({
        temperature: 999, 
        humidity: 0, 
        timestamp: Date.now(),
        sequence: 99999
    });

    client.publish(topic, payload);
    console.log('\x1b[31m📤 [ATTACK] Rogue unencrypted packet sent.\x1b[0m');
    setTimeout(() => process.exit(0), 500);
});