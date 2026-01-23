import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initWebSocket, getConnectionStats } from './services/websocket.js';
import { authenticateApiKey } from './middleware/auth.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import menuRouter from './routes/menu.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  const wsStats = getConnectionStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    websocket: wsStats
  });
});

// API routes (with auth handled inside routes for granular control)
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter); // Payment page is public
app.use('/api/menu', menuRouter); // Menu is public

// Serve static files from the React app (built frontend)
const clientBuildPath = join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Serve React app for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(clientBuildPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('🍜 ═══════════════════════════════════════════════════════');
  console.log('   Ming Hin Cuisine - Mock POS System');
  console.log('   ═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`   🚀 Server running on: http://localhost:${PORT}`);
  console.log(`   🔌 WebSocket available on: ws://localhost:${PORT}`);
  console.log(`   🌐 CORS enabled for: ${process.env.CORS_ORIGIN}`);
  console.log(`   🔑 API Key: ${process.env.API_KEY}`);
  console.log('');
  console.log('   📚 API Endpoints:');
  console.log(`      POST   /api/orders          - Create new order`);
  console.log(`      GET    /api/orders          - List orders`);
  console.log(`      GET    /api/orders/:id      - Get order details`);
  console.log(`      PUT    /api/orders/:id      - Update order`);
  console.log(`      DELETE /api/orders/:id      - Cancel order`);
  console.log(`      POST   /api/payments        - Process payment`);
  console.log(`      GET    /api/menu            - Get full menu`);
  console.log(`      GET    /api/menu/:category  - Get menu by category`);
  console.log('');
  console.log('   💡 Test with:');
  console.log(`      curl http://localhost:${PORT}/health`);
  console.log('');
  console.log('   🛑 Press Ctrl+C to stop the server');
  console.log('   ═══════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
