import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
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

// CORS configuration for production
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    
    // In production, also allow railway.app domains
    if (origin.includes('.up.railway.app') || origin.includes('.railway.app')) {
      return callback(null, true);
    }
    
    // Allow same-origin requests
    callback(null, true);
  },
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
    websocket: wsStats,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/menu', menuRouter);

// Serve static files from the React app (built frontend)
const clientBuildPath = join(__dirname, '../client/dist');

if (existsSync(clientBuildPath)) {
  console.log('📁 Serving static files from:', clientBuildPath);
  app.use(express.static(clientBuildPath));
  
  // Serve React app for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(join(clientBuildPath, 'index.html'));
    }
  });
} else {
  console.log('⚠️  Client build not found at:', clientBuildPath);
  console.log('   Run "npm run build" to create production build');
}

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
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🍜 ═══════════════════════════════════════════════════════');
  console.log('   Ming Hin Cuisine - Mock POS System');
  console.log('   ═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`   🚀 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`   🔌 WebSocket available on same port`);
  console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔑 API Key: ${process.env.API_KEY ? '***configured***' : 'NOT SET!'}`);
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
