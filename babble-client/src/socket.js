import { io } from 'socket.io-client';

const socket = io('https://babble-chatapp.netlify.app', { autoConnect: false });

export default socket;