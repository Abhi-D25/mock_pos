# Ming Hin Cuisine - Mock POS System

A full-stack Mock Point of Sale (POS) system for Ming Hin Cuisine, a Chinese restaurant in Chicago. This system simulates how an AI Voice ordering agent would integrate with a real POS system, receiving orders via API, displaying them on a dashboard, and processing mock payments.

## Features

- **Real-time Order Management**: WebSocket-powered live updates for incoming orders
- **Customer Payment Portal**: Mobile-responsive payment page with mock Stripe-style form
- **Order Status Tracking**: Visual dashboard for managing order lifecycle
- **Complete Menu System**: Full menu with 364 items across 15 categories
- **Sound Notifications**: Audio alerts for new orders
- **Order History**: View completed and cancelled orders
- **Mock Payment Processing**: Simulated payment system with test card numbers

## Tech Stack

### Backend
- Node.js with Express.js
- SQLite (file-based database)
- WebSocket (ws library)
- UUID for ID generation

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS
- React Router
- date-fns (date formatting)

## Project Structure

```
minghin-pos/
├── server/
│   ├── index.js                    # Express server entry point
│   ├── routes/
│   │   ├── orders.js               # Order CRUD operations
│   │   ├── payments.js             # Payment processing
│   │   └── menu.js                 # Menu data endpoints
│   ├── middleware/
│   │   └── auth.js                 # API key authentication
│   ├── services/
│   │   ├── orderService.js         # Order business logic
│   │   ├── paymentService.js       # Payment processing logic
│   │   └── websocket.js            # WebSocket handler
│   ├── database/
│   │   ├── init.js                 # SQLite initialization
│   │   └── schema.sql              # Database schema
│   └── data/
│       └── menu.json               # Full menu with prices
├── client/
│   ├── src/
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # React entry point
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Main POS dashboard
│   │   │   ├── PaymentPage.jsx     # Customer payment page
│   │   │   └── OrderHistory.jsx    # Completed orders
│   │   ├── components/
│   │   │   ├── OrderCard.jsx       # Order summary card
│   │   │   ├── OrderQueue.jsx      # Queue of incoming orders
│   │   │   ├── OrderItemList.jsx   # List of items in order
│   │   │   ├── PaymentForm.jsx     # Mock Stripe-style form
│   │   │   ├── StatusBadge.jsx     # Order status indicator
│   │   │   ├── Navbar.jsx          # Navigation
│   │   │   └── Toast.jsx           # Notifications
│   │   ├── hooks/
│   │   │   └── useWebSocket.js     # WebSocket connection
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   └── styles/
│   │       └── index.css           # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json
├── .env
└── README.md
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup

1. **Clone or navigate to the project directory**

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**

   The `.env` file should already exist with:
   ```
   PORT=3000
   API_KEY=minghin-pos-api-key-2026
   DATABASE_PATH=./server/database/pos.db
   CORS_ORIGIN=http://localhost:5173
   WS_PORT=3001
   NODE_ENV=development
   ```

5. **Initialize the database**
   ```bash
   npm run db:init
   ```

   This will:
   - Create the SQLite database
   - Set up all tables
   - Load all 364 menu items

## Running the Application

### Development Mode (Recommended)

Run both server and client concurrently:

```bash
npm run dev
```

This starts:
- Backend server: http://localhost:3000
- Frontend app: http://localhost:5173

### Production Mode

Run server only:
```bash
npm start
```

Run client only:
```bash
cd client
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

Protected endpoints require the API key in headers:
```
X-API-Key: minghin-pos-api-key-2026
```

### Endpoints

#### Orders

**POST /api/orders** - Create new order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: minghin-pos-api-key-2026" \
  -d '{
    "source": "ai_voice_agent",
    "customer": {
      "name": "John Smith",
      "phone": "+1-312-555-1234"
    },
    "order_type": "pickup",
    "scheduled_time": "2026-01-22T15:30:00Z",
    "items": [
      {
        "menu_item_id": "dim_sum_001",
        "name": "Siu Mai",
        "quantity": 2,
        "unit_price": 7.65,
        "modifiers": [],
        "notes": ""
      },
      {
        "menu_item_id": "poultry_001",
        "name": "Orange Chicken",
        "quantity": 1,
        "unit_price": 20.85,
        "modifiers": [],
        "notes": ""
      }
    ],
    "special_instructions": "Extra napkins"
  }'
```

**GET /api/orders** - List orders
```bash
curl http://localhost:3000/api/orders?status=pending_payment&limit=50 \
  -H "X-API-Key: minghin-pos-api-key-2026"
```

**GET /api/orders/:id** - Get single order
```bash
curl http://localhost:3000/api/orders/ORD-20260122-0001 \
  -H "X-API-Key: minghin-pos-api-key-2026"
```

**PUT /api/orders/:id** - Update order status
```bash
curl -X PUT http://localhost:3000/api/orders/ORD-20260122-0001 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: minghin-pos-api-key-2026" \
  -d '{"status": "preparing"}'
```

**DELETE /api/orders/:id** - Cancel order
```bash
curl -X DELETE http://localhost:3000/api/orders/ORD-20260122-0001 \
  -H "X-API-Key: minghin-pos-api-key-2026"
```

#### Payments

**POST /api/payments** - Process payment
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20260122-0001",
    "method": "card",
    "card": {
      "number": "4242424242424242",
      "exp_month": "12",
      "exp_year": "2028",
      "cvc": "123",
      "name": "John Smith"
    }
  }'
```

#### Menu

**GET /api/menu** - Get full menu
```bash
curl http://localhost:3000/api/menu
```

**GET /api/menu/:category** - Get menu by category
```bash
curl http://localhost:3000/api/menu/dim_sum
```

**GET /api/menu/item/:id** - Get single menu item
```bash
curl http://localhost:3000/api/menu/item/dim_sum_001
```

## Test Card Numbers

Use these card numbers for testing payments:

- **4242 4242 4242 4242** - Success (Visa)
- **5555 5555 5555 4444** - Success (Mastercard)
- **4000 0000 0000 0002** - Declined

Use any future expiry date, any 3-digit CVC, and any name.

## Testing the Complete System

### 1. Start the system
```bash
npm run dev
```

### 2. Create a test order via API
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: minghin-pos-api-key-2026" \
  -d '{
    "source": "ai_voice_agent",
    "customer": {
      "name": "Test Customer",
      "phone": "+1-312-555-0000"
    },
    "order_type": "pickup",
    "items": [
      {
        "menu_item_id": "dim_sum_001",
        "name": "Siu Mai",
        "quantity": 2,
        "unit_price": 7.65,
        "modifiers": [],
        "notes": ""
      }
    ],
    "special_instructions": "Test order"
  }'
```

### 3. Check the Dashboard
- Navigate to http://localhost:5173/dashboard
- You should see the new order appear (with sound notification)
- The order will be in "Pending Payment" status

### 4. Process Payment
- Copy the `payment_url` from the API response
- Open it in a browser (or use the order ID from the response)
- Navigate to: http://localhost:5173/pay/ORD-YYYYMMDD-XXXX
- Fill in the payment form with a test card number
- Submit the payment

### 5. Verify Payment on Dashboard
- Go back to the dashboard
- The order status should automatically update to "Paid"
- Click on the order to see payment details

### 6. Advance Order Status
- Click "Mark as preparing" to move order to preparation
- Click "Mark as ready" to mark order ready for pickup
- Click "Mark as completed" to complete the order

### 7. View Order History
- Navigate to http://localhost:5173/history
- See the completed order in the history table

## Order Status Flow

```
pending_payment → paid → preparing → ready → completed
                   ↓
                cancelled
```

## Features Details

### Real-time Updates
- WebSocket connection for instant updates
- Automatic reconnection with exponential backoff
- Connection status indicator in navbar

### Sound Notifications
- Audio alert when new orders arrive
- Toggle on/off in navbar
- Uses Web Audio API for cross-browser compatibility

### Mobile Responsive
- Payment page fully optimized for mobile devices
- Dashboard works on tablet and desktop

### Payment Simulation
- 2-second processing delay
- Card format validation
- Test card support for success/failure scenarios

## Troubleshooting

### Database Issues
If you encounter database errors:
```bash
rm server/database/pos.db*
npm run db:init
```

### Port Conflicts
If ports 3000 or 5173 are in use, update `.env` and `client/vite.config.js`

### WebSocket Connection Issues
- Check that both server and client are running
- Verify CORS settings in `.env`
- Check browser console for WebSocket errors

## Development Notes

### Adding Menu Items
Edit `server/data/menu.json` and run:
```bash
npm run db:init
```

### Changing Tax Rate
Update the `tax_rate` in `server/data/menu.json` (currently 10.25% for Chicago)

### API Key
Change `API_KEY` in `.env` for production deployments

## Important Notes

1. **This is a SIMULATION** - No real payments are processed
2. **SQLite Database** - File-based, stored in `server/database/pos.db`
3. **API Authentication** - Required for order creation/management
4. **Payment Page** - Public access for customer payments
5. **Order ID Format** - ORD-YYYYMMDD-XXXX (resets daily)

## License

This is a mock/demo system for Ming Hin Cuisine integration testing.

## Support

For issues or questions, check the console logs in both server and browser.
