import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ordersApi } from './services/api';
import useWebSocket from './hooks/useWebSocket';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PaymentPage from './pages/PaymentPage';
import OrderHistory from './pages/OrderHistory';
import { ToastContainer } from './components/Toast';
import './styles/index.css';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Toast management
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const response = await ordersApi.getAll({ limit: 100 });
      setOrders(response.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      addToast({
        type: 'error',
        message: 'Failed to load orders'
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle order updates
  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders(prev => {
      const index = prev.findIndex(o => o.id === updatedOrder.id);
      if (index >= 0) {
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        return newOrders;
      }
      return prev;
    });
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'new_order':
        setOrders(prev => [data.payload, ...prev]);
        playNotificationSound();
        addToast({
          type: 'info',
          message: `New order received: ${data.payload.id}`,
          duration: 5000
        });
        break;

      case 'order_updated':
        handleOrderUpdate(data.payload);
        break;

      case 'payment_received':
        handleOrderUpdate(data.payload.order);
        addToast({
          type: 'success',
          message: `Payment received for ${data.payload.order.id}`,
          duration: 4000
        });
        break;

      case 'connected':
        console.log('WebSocket connected:', data.message);
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [addToast, handleOrderUpdate, playNotificationSound]);

  // Initialize WebSocket
  const { isConnected } = useWebSocket(handleWebSocketMessage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Payment page (no navbar) */}
          <Route path="/pay/:orderId" element={<PaymentPage />} />

          {/* Dashboard routes (with navbar) */}
          <Route
            path="/*"
            element={
              <>
                <Navbar
                  isWsConnected={isConnected}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(prev => !prev)}
                />
                <div className="flex-1 overflow-hidden">
                  <div className="max-w-7xl mx-auto px-4 py-6 h-full">
                    <Routes>
                      <Route
                        path="/dashboard"
                        element={
                          <Dashboard
                            orders={orders}
                            onOrderUpdate={handleOrderUpdate}
                            addToast={addToast}
                          />
                        }
                      />
                      <Route
                        path="/history"
                        element={<OrderHistory orders={orders} />}
                      />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </div>
              </>
            }
          />
        </Routes>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </BrowserRouter>
  );
}

export default App;
