// runServer.js
import { config } from 'dotenv';
config();

// Force port 3000 to match the simulator's default URL
process.env.SERVER_PORT = process.env.SERVER_PORT || 3000;

console.log('\x1b[34m========================================================\x1b[0m');
console.log('\x1b[34m🛡️  STARTING CENTRAL AUTHENTICATION SERVER 🛡️\x1b[0m');
console.log(`\x1b[34m    Listening on Port: ${process.env.SERVER_PORT}\x1b[0m`);
console.log('\x1b[34m========================================================\x1b[0m');

// Importing server.js triggers the app.listen() and mqttServer.start() 
// defined in the original source file
import './src/server.js';

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\x1b[31m[SYSTEM] Shutting down server...\x1b[0m');
  process.exit(0);
});