import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { EventLog } from '../models/eventLog.model';
import { Server } from 'socket.io';
import { CBORService } from './cbor.service';
import { idsService } from './ids.service';

declare global {
    var io: Server | undefined;
}

interface ErrorEvent {
    _id: string;
    device_id: string;
    timestamp: Date;
    event_type: string;
    message: string;
}

type MessageCallback = (topic: string, message: Buffer, clientId: string) => void;

class MQTTService {
    private client: MqttClient;
    private static instance: MQTTService;
    private readonly EVENT_LOG_TOPIC = 'microgrid/events/error';
    private readonly ALL_EVENTS_TOPIC = 'microgrid/events/#';
    private readonly MQTT_URL = 'mqtt://localhost:1883';
    private readonly USE_CBOR = true;
    private messageCallbacks: MessageCallback[] = [];
    private connectedClients: Map<string, any> = new Map();

    private constructor() {
        console.log('[MQTT] Initializing MQTT service...');
        const options: IClientOptions = {
            clientId: `surveillance-${Math.random().toString(16).slice(3)}`,
            username: 'admin',
            password: '$7$101$2KWvl9zHpWaYgcbG$ONaSwiDXEcN1o46BQ68QfRHOZeQZzn7lqf3XqGvNtM6oMVvvKFRh0uFLOUl96KDInyNhZS8vYIyN5KPZI5k1Cg==',
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 5000
        };

        console.log(`[MQTT] Connecting to broker at ${this.MQTT_URL}...`);
        this.client = mqtt.connect(this.MQTT_URL, options);
        this.setupEventHandlers();
        this.setupSubscriptions();
    }

    public static getInstance(): MQTTService {
        if (!MQTTService.instance) {
            MQTTService.instance = new MQTTService();
        }
        return MQTTService.instance;
    }

    private setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('[MQTT] Successfully connected to broker');
            this.setupSubscriptions();
        });

        this.client.on('error', (error: Error) => {
            console.error('[MQTT] Error:', error);
            console.error('[MQTT] Error details:', {
                message: error.message,
                stack: error.stack
            });
        });

        this.client.on('close', () => {
            console.log('[MQTT] Connection closed');
        });

        this.client.on('reconnect', () => {
            console.log('[MQTT] Attempting to reconnect...');
        });

        this.client.on('offline', () => {
            console.log('[MQTT] Client went offline');
        });

        // Track client connections
        this.client.on('clientConnected', (clientId: string) => {
            console.log(`[MQTT] Client connected: ${clientId}`);
            this.connectedClients.set(clientId, {
                connectedAt: Date.now(),
                messageCount: 0
            });
        });

        this.client.on('clientDisconnected', (clientId: string) => {
            console.log(`[MQTT] Client disconnected: ${clientId}`);
            this.connectedClients.delete(clientId);
        });
    }

    private setupSubscriptions() {
        if (!this.client.connected) {
            console.log('[MQTT] Client not connected, skipping subscription setup');
            return;
        }

        console.log('[MQTT] Setting up subscriptions...');
        const topics = [
            this.EVENT_LOG_TOPIC,
            this.ALL_EVENTS_TOPIC,
            'grid/transaction/response',
            'grid/status/response',
            'microgrid/commands/response',
            'microgrid/test/dos'  // Add test topic
        ];

        this.client.subscribe(topics, (err) => {
            if (err) {
                console.error('[MQTT] Subscription error:', err);
                return;
            }
            console.log(`[MQTT] Successfully subscribed to topics: ${topics.join(', ')}`);
        });

        this.client.on('message', async (topic: string, message: Buffer) => {
            try {
                console.log(`[MQTT] Received message on topic: ${topic}`);
                let eventLog;
                
                // Get client ID from the message
                const clientId = this.getClientIdFromMessage(message);
                console.log(`[MQTT] Message from client: ${clientId}`);
                
                // Notify IDS about the message
                this.messageCallbacks.forEach(callback => {
                    try {
                        callback(topic, message, clientId);
                    } catch (error) {
                        console.error('[MQTT] Error in message callback:', error);
                    }
                });

                // Try to decode as CBOR first, fall back to JSON if it fails
                if (CBORService.isCBOR(message)) {
                    console.log('[MQTT] Decoding CBOR message');
                    eventLog = CBORService.decodeErrorEvent(message);
                } else {
                    console.log('[MQTT] Decoding JSON message');
                    eventLog = JSON.parse(message.toString());
                }
                
                console.log('[MQTT] Decoded message:', eventLog);
                
                // Process any message with ERROR severity
                if (eventLog.severity === 'ERROR' || 
                    eventLog.event_type?.includes('ERROR') || 
                    eventLog.error) {
                    console.log('[MQTT] Processing ERROR event...');
                    const savedEvent = new EventLog({
                        device_id: eventLog.device_id || eventLog.target_device_id || 'unknown',
                        timestamp: new Date(eventLog.timestamp || Date.now()),
                        event_type: eventLog.event_type || 'ERROR',
                        severity: 'ERROR',
                        message: eventLog.message || eventLog.error || JSON.stringify(eventLog),
                        acknowledged: false
                    });
                    await savedEvent.save();
                    console.log('[MQTT] Saved error event:', savedEvent);

                    this.emitErrorEvent(savedEvent);
                }
            } catch (error) {
                console.error('[MQTT] Error processing message:', error);
                console.error('[MQTT] Raw message:', message.toString());
            }
        });
    }

    private getClientIdFromMessage(message: Buffer): string {
        try {
            const decoded = CBORService.isCBOR(message) 
                ? CBORService.decodeErrorEvent(message)
                : JSON.parse(message.toString());
            return decoded.device_id || decoded.client_id || 'unknown';
        } catch {
            return 'unknown';
        }
    }

    public onMessage(callback: MessageCallback) {
        console.log('[MQTT] Registering new message callback');
        this.messageCallbacks.push(callback);
    }

    public disconnectClient(clientId: string) {
        console.log(`[MQTT] Attempting to disconnect client: ${clientId}`);
        // Implement client disconnection logic
        // This is a placeholder - actual implementation depends on your MQTT broker
    }

    private emitErrorEvent(eventLog: ErrorEvent) {
        if (global.io) {
            global.io.emit('error_event', {
                id: eventLog._id,
                device_id: eventLog.device_id,
                timestamp: eventLog.timestamp,
                event_type: eventLog.event_type,
                message: eventLog.message
            });
        }
    }

    public disconnect() {
        if (this.client.connected) {
            this.client.end();
        }
    }
}

export const mqttService = MQTTService.getInstance(); 