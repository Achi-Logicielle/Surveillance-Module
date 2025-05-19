import { EventLog } from '../models/eventLog.model';
import { mqttService } from './mqtt.service';

interface MessageStats {
    count: number;
    firstTimestamp: number;
    lastTimestamp: number;
    source: string;
}

interface DoSThresholds {
    maxMessagesPerMinute: number;
    maxMessagesPerSecond: number;
    suspiciousIPs: Set<string>;
}

export class IDSService {
    private static instance: IDSService;
    private messageStats: Map<string, MessageStats> = new Map();
    private readonly thresholds: DoSThresholds = {
        maxMessagesPerMinute: 1000,  // Maximum messages per minute from a single source
        maxMessagesPerSecond: 50,    // Maximum messages per second from a single source
        suspiciousIPs: new Set()     // Track suspicious IPs
    };
    private readonly cleanupInterval = 60000; // Clean up old stats every minute

    private constructor() {
        console.log('[IDS] Initializing IDS service...');
        this.startMonitoring();
        this.setupCleanupInterval();
        console.log('[IDS] Service initialized with thresholds:', {
            maxMessagesPerSecond: this.thresholds.maxMessagesPerSecond,
            maxMessagesPerMinute: this.thresholds.maxMessagesPerMinute
        });
    }

    public static getInstance(): IDSService {
        if (!IDSService.instance) {
            IDSService.instance = new IDSService();
        }
        return IDSService.instance;
    }

    private startMonitoring() {
        console.log('[IDS] Starting message monitoring...');
        mqttService.onMessage((topic: string, message: Buffer, clientId: string) => {
            console.log(`[IDS] Received message from ${clientId} on topic ${topic}`);
            this.analyzeMessage(topic, message, clientId);
        });
    }

    private async analyzeMessage(topic: string, message: Buffer, clientId: string) {
        const now = Date.now();
        const stats = this.messageStats.get(clientId) || {
            count: 0,
            firstTimestamp: now,
            lastTimestamp: now,
            source: clientId
        };

        // Update stats
        stats.count++;
        stats.lastTimestamp = now;

        // Check for DoS patterns
        const timeWindow = now - stats.firstTimestamp;
        const messagesPerSecond = stats.count / (timeWindow / 1000);
        const messagesPerMinute = stats.count / (timeWindow / 60000);

        // Log current stats for debugging
        console.log(`[IDS] Stats for ${clientId}:`, {
            count: stats.count,
            messagesPerSecond: messagesPerSecond.toFixed(2),
            messagesPerMinute: messagesPerMinute.toFixed(2),
            timeWindow: (timeWindow / 1000).toFixed(2) + 's'
        });

        // Detect potential DoS attack
        if (messagesPerSecond > this.thresholds.maxMessagesPerSecond ||
            messagesPerMinute > this.thresholds.maxMessagesPerMinute) {
            
            console.log(`[IDS] Potential DoS attack detected from ${clientId}!`);
            console.log(`[IDS] Current rates: ${messagesPerSecond.toFixed(2)} msgs/sec, ${messagesPerMinute.toFixed(2)} msgs/min`);
            
            this.thresholds.suspiciousIPs.add(clientId);
            
            // Log the potential attack
            await this.logDoSAttempt(clientId, {
                messagesPerSecond,
                messagesPerMinute,
                totalMessages: stats.count,
                timeWindow: timeWindow / 1000
            });

            // Take action (e.g., block the client)
            this.handleDoSAttempt(clientId);
        }

        this.messageStats.set(clientId, stats);
    }

    private async logDoSAttempt(clientId: string, metrics: any) {
        try {
            const eventLog = new EventLog({
                device_id: clientId,
                timestamp: new Date(),
                event_type: 'DOS_ATTACK_DETECTED',
                severity: 'CRITICAL',
                message: `Potential DoS attack detected from ${clientId}. ` +
                        `Metrics: ${JSON.stringify(metrics)}`,
                acknowledged: false
            });
            await eventLog.save();
            console.log(`[IDS] Logged potential DoS attack from ${clientId}`);
        } catch (error) {
            console.error('[IDS] Error logging DoS attempt:', error);
        }
    }

    private handleDoSAttempt(clientId: string) {
        console.log(`[IDS] Taking action against potential DoS attack from ${clientId}`);
        console.log(`[IDS] Current suspicious IPs:`, Array.from(this.thresholds.suspiciousIPs));
        
        // Example: Disconnect the client
        mqttService.disconnectClient(clientId);
    }

    private setupCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            for (const [clientId, stats] of this.messageStats.entries()) {
                // Remove stats older than 5 minutes
                if (now - stats.lastTimestamp > 300000) {
                    this.messageStats.delete(clientId);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                console.log(`[IDS] Cleaned up ${cleanedCount} old client stats`);
            }
        }, this.cleanupInterval);
    }

    public isSuspiciousIP(clientId: string): boolean {
        return this.thresholds.suspiciousIPs.has(clientId);
    }

    public getMessageStats(): Map<string, MessageStats> {
        return new Map(this.messageStats);
    }
}

export const idsService = IDSService.getInstance(); 