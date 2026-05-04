import { io } from 'socket.io-client';

const socket = io(`${process.env.VITE_BACKEND_URL}`, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});

socket.on('connect', () => {
  console.log('Connected to real-time server');
});

socket.on('reconnect', (attempt) => {
  console.log('Reconnected to server after', attempt, 'attempts');
});

export default socket;
