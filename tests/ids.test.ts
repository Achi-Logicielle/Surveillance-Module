import mqtt from 'mqtt';
import { idsService } from '../services/ids.service';

// Configuration
const MQTT_URL = 'mqtt://localhost:1883';
const TEST_TOPIC = 'microgrid/test/dos';
const ATTACKER_CLIENT_ID = 'attacker-client';
const NORMAL_CLIENT_ID = 'normal-client';

// Create MQTT clients
const attackerClient = mqtt.connect(MQTT_URL, {
    clientId: ATTACKER_CLIENT_ID,
    username: 'admin',
    password: '$7$101$2KWvl9zHpWaYgcbG$ONaSwiDXEcN1o46BQ68QfRHOZeQZzn7lqf3XqGvNtM6oMVvvKFRh0uFLOUl96KDInyNhZS8vYIyN5KPZI5k1Cg=='
});

const normalClient = mqtt.connect(MQTT_URL, {
    clientId: NORMAL_CLIENT_ID,
    username: 'admin',
    password: '$7$101$2KWvl9zHpWaYgcbG$ONaSwiDXEcN1o46BQ68QfRHOZeQZzn7lqf3XqGvNtM6oMVvvKFRh0uFLOUl96KDInyNhZS8vYIyN5KPZI5k1Cg=='
});

let attackMessageCount = 0;
let normalMessageCount = 0;

// Test normal traffic
function sendNormalTraffic() {
    const message = {
        device_id: NORMAL_CLIENT_ID,
        timestamp: new Date(),
        event_type: 'NORMAL_OPERATION',
        severity: 'INFO',
        message: 'Normal operation message'
    };

    normalClient.publish(TEST_TOPIC, JSON.stringify(message));
    normalMessageCount++;
    console.log(`[Normal] Sent message ${normalMessageCount}`);
}

// Simulate DoS attack
function simulateDoSAttack() {
    const message = {
        device_id: ATTACKER_CLIENT_ID,
        timestamp: new Date(),
        event_type: 'ATTACK_MESSAGE',
        severity: 'INFO',
        message: 'Attack message'
    };

    // Send messages rapidly
    const interval = setInterval(() => {
        attackerClient.publish(TEST_TOPIC, JSON.stringify(message));
        attackMessageCount++;
        if (attackMessageCount % 100 === 0) {
            console.log(`[Attacker] Sent ${attackMessageCount} messages`);
        }
    }, 5); // Send message every 5ms (more aggressive)

    // Stop attack after 5 seconds
    setTimeout(() => {
        clearInterval(interval);
        console.log(`[Attacker] Attack simulation completed. Total messages sent: ${attackMessageCount}`);
    }, 5000);
}

// Setup event handlers
attackerClient.on('connect', () => {
    console.log('[Attacker] Connected to MQTT broker');
});

attackerClient.on('error', (error) => {
    console.error('[Attacker] Error:', error);
});

attackerClient.on('close', () => {
    console.log('[Attacker] Connection closed');
});

normalClient.on('connect', () => {
    console.log('[Normal] Connected to MQTT broker');
});

normalClient.on('error', (error) => {
    console.error('[Normal] Error:', error);
});

normalClient.on('close', () => {
    console.log('[Normal] Connection closed');
});

// Start the test
console.log('Starting IDS test...');
console.log('Test configuration:');
console.log('- Normal client: 1 message per second');
console.log('- Attacker client: 1 message every 5ms');
console.log('- Test duration: 10 seconds');
console.log('- Attack duration: 5 seconds');

// Send normal traffic every second
const normalInterval = setInterval(sendNormalTraffic, 1000);

// Start DoS attack after 2 seconds
setTimeout(simulateDoSAttack, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
    console.log('\nTest completed. Summary:');
    console.log(`- Normal messages sent: ${normalMessageCount}`);
    console.log(`- Attack messages sent: ${attackMessageCount}`);
    console.log(`- Total messages: ${normalMessageCount + attackMessageCount}`);
    
    clearInterval(normalInterval);
    attackerClient.end();
    normalClient.end();
    process.exit(0);
}, 10000); 