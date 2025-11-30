// services/websocketService.js
const WebSocket = require('ws');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    
    this.wss.on('connection', (ws, req) => {
      const userId = this.getUserIdFromRequest(req);
      if (userId) {
        this.clients.set(userId, ws);
        
        ws.on('close', () => {
          this.clients.delete(userId);
        });
      }
    });
  }
  
  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

module.exports = WebSocketService;