# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Initialize Database

```bash
# Load menu data (285 items across 15 categories)
node server/database/init.js
```

### 3. Start the System

```bash
# Start both server and client concurrently
npm run dev
```

The system will be available at:
- **Backend API**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:5173/dashboard

## 🧪 Test the System

### Create a Test Order

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

### Process Payment

1. Copy the `order_id` from the response (e.g., ORD-20260122-0001)
2. Navigate to: http://localhost:5173/pay/ORD-20260122-0001
3. Use test card: 4242 4242 4242 4242
4. Fill in any future expiry, CVC 123, and any name
5. Click "Pay" and wait 2 seconds for processing

### View on Dashboard

1. Go to http://localhost:5173/dashboard
2. You'll see your order with a notification sound
3. Click on the order to see details
4. Use the buttons to advance order status:
   - pending_payment → paid → preparing → ready → completed

## 📊 Key Features Verified

✅ Real-time WebSocket updates
✅ Order creation via API
✅ Mock payment processing with 2-second delay
✅ Order status management
✅ Complete menu system (285 items)
✅ Sound notifications for new orders
✅ Mobile-responsive payment page
✅ Order history tracking

## 🔧 Troubleshooting

**Port Already in Use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Database Issues?**
```bash
# Reset database
rm server/database/pos.db*
node server/database/init.js
```

## 📝 Test Card Numbers

- **4242 4242 4242 4242** - Success (Visa)
- **5555 5555 5555 4444** - Success (Mastercard)
- **4000 0000 0000 0002** - Declined

## 🎯 API Key

For protected endpoints, use:
```
X-API-Key: minghin-pos-api-key-2026
```

## 📚 Full Documentation

See [README.md](README.md) for complete API documentation and detailed instructions.

## ✨ System Status

Current backend server is running with:
- ✅ Database initialized with 285 menu items
- ✅ WebSocket server active
- ✅ Test order created and paid successfully
- ✅ All API endpoints tested and working

Enjoy testing the Ming Hin Cuisine POS System! 🍜
