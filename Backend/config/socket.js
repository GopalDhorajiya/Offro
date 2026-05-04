import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitOfferUpdate = (offer) => {
    if (io) {
        console.log(`[Socket] Emitting offerUpdated for ID: ${offer.id}`);
        io.emit('offerUpdated', offer);
    } else {
        console.warn('[Socket] Cannot emit update: io not initialized');
    }
};

export const emitOfferDelete = (offerId) => {
    if (io) {
        console.log(`[Socket] Emitting offerDeleted for ID: ${offerId}`);
        io.emit('offerDeleted', offerId);
    } else {
        console.warn('[Socket] Cannot emit delete: io not initialized');
    }
};
