import * as cbor from 'cbor';

interface ErrorEvent {
    device_id: string;
    timestamp: Date;
    event_type: string;
    severity: string;
    message: string;
}

export class CBORService {
    private static readonly ERROR_EVENT_SCHEMA = {
        d: 'device_id',
        t: 'timestamp',
        e: 'event_type',
        s: 'severity',
        m: 'message'
    };

    static encodeErrorEvent(event: ErrorEvent): Buffer {
        const compactEvent = {
            d: event.device_id,
            t: event.timestamp.getTime(),
            e: event.event_type,
            s: event.severity,
            m: event.message
        };
        return cbor.encode(compactEvent);
    }

    static decodeErrorEvent(buffer: Buffer): ErrorEvent {
        const decoded = cbor.decode(buffer);
        return {
            device_id: decoded.d,
            timestamp: new Date(decoded.t),
            event_type: decoded.e,
            severity: decoded.s,
            message: decoded.m
        };
    }

    // Helper to check if a buffer is CBOR encoded
    static isCBOR(buffer: Buffer): boolean {
        try {
            cbor.decode(buffer);
            return true;
        } catch {
            return false;
        }
    }
} 