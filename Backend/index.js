import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/dbconnect.js';

import cors from 'cors';
import bodyParser from 'body-parser';
import shopRoutes from './routes/shopRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';

dotenv.config();

await connectDB();

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`);
        console.log('Request Body:', req.body);
        console.log('Request Query:', req.query);
        console.log('---');
    });
    next();
});

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use('/api/claims', claimRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/server-time', (req, res) => {
    res.json({ serverTime: Date.now() });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});