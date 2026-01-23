import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

// Initialize WebSocket server
export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('✅ New WebSocket client connected');
    clients.add(ws);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('👋 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Ming Hin POS WebSocket'
    }));
  });

  console.log('🔌 WebSocket server initialized');
}

// Handle incoming messages from clients
function handleClientMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'subscribe':
      // Client subscribes to order updates
      ws.send(JSON.stringify({
        type: 'subscribed',
        message: 'Successfully subscribed to order updates'
      }));
      break;

    case 'ping':
      // Heartbeat
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }));
  }
}

// Broadcast message to all connected clients
export function broadcast(message) {
  if (!wss) {
    console.warn('⚠️  WebSocket server not initialized');
    return;
  }

  const messageStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('❌ Error sending message to client:', error);
      }
    }
  });
}

// Notify about new order
export function notifyNewOrder(order) {
  broadcast({
    type: 'new_order',
    payload: order
  });
  console.log(`📢 Broadcasted new order: ${order.id}`);
}

// Notify about order update
export function notifyOrderUpdate(order) {
  broadcast({
    type: 'order_updated',
    payload: order
  });
  console.log(`📢 Broadcasted order update: ${order.id}`);
}

// Notify about payment received
export function notifyPaymentReceived(payment, order) {
  broadcast({
    type: 'payment_received',
    payload: {
      payment,
      order
    }
  });
  console.log(`📢 Broadcasted payment received: ${payment.id}`);
}

// Get connection stats
export function getConnectionStats() {
  return {
    connected_clients: clients.size,
    server_running: wss !== null
  };
}

export default {
  initWebSocket,
  broadcast,
  notifyNewOrder,
  notifyOrderUpdate,
  notifyPaymentReceived,
  getConnectionStats
};
