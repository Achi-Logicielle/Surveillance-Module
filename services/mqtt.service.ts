import mqtt, { MqttClient } from 'mqtt';

interface Alert {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
    source: string;
    device_id?: string;
}

class MQTTService {
    private client: MqttClient;
    private readonly MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    private readonly ALERT_TOPIC = 'microgrid/alerts';

    constructor() {
        this.client = mqtt.connect(this.MQTT_BROKER);
        this.setupMQTTClient();
    }

    private setupMQTTClient() {
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });

        this.client.on('error', (error) => {
            console.error('MQTT Client Error:', error);
        });
    }

    public publishAlert(alert: Alert) {
        return new Promise<void>((resolve, reject) => {
            this.client.publish(
                this.ALERT_TOPIC,
                JSON.stringify({
                    ...alert,
                    timestamp: new Date().toISOString()
                }),
                { qos: 1 },
                (error) => {
                    if (error) {
                        console.error('Error publishing alert:', error);
                        reject(error);
                    } else {
                        console.log('Alert published successfully');
                        resolve();
                    }
                }
            );
        });
    }

    public disconnect() {
        this.client.end();
    }
}

export default new MQTTService(); 