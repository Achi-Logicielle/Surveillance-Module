import fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import mongoose from 'mongoose';
import { mqttService } from './services/mqtt.service';
import { Server, DefaultEventsMap } from 'socket.io';

const server = fastify({
    logger: true
});

// Register Socket.IO plugin
server.register(fastifyIO, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Connect to MongoDB
mongoose.connect('mongodb+srv://llaouinine:V6Yh16p6kAN4n7eR@cluster0.4htxlff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize services after server is ready
server.ready().then(() => {
    // Initialize MQTT service
    console.log('Initializing MQTT service...');
    const mqtt = mqttService;
    console.log('MQTT service initialized');

    // Socket.IO connection handling
    server.io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        socket.on('acknowledge_error', async (data) => {
            try {
                const { errorId } = data;
                await mongoose.model('EventLog').findByIdAndUpdate(
                    errorId,
                    { acknowledged: true }
                );
                console.log(`Error ${errorId} acknowledged`);
            } catch (error) {
                console.error('Error acknowledging error:', error);
            }
        });
    });

    // Make io instance globally available
    global.io = server.io;
});

// Start the server
const start = async () => {
    try {
        await server.listen({ port: 4000, host: '0.0.0.0' });
        console.log('Server is running on port 4000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    mqttService.disconnect();
    await server.close();
    process.exit(0);
});

start();
