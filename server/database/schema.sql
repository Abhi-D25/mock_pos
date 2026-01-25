-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'ai_voice_agent',
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK(order_type IN ('pickup', 'delivery', 'dine_in')),
    scheduled_time DATETIME,
    special_instructions TEXT,
    subtotal REAL NOT NULL,
    tax_rate REAL NOT NULL DEFAULT 0.1025,
    tax_amount REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment'
        CHECK(status IN ('pending_payment', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
    payment_method TEXT,
    payment_id TEXT,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    modifiers TEXT,
    notes TEXT,
    line_total REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Menu items table (pre-populated)
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    chinese_name TEXT,
    description TEXT,
    price REAL NOT NULL,
    modifiers TEXT,
    is_available BOOLEAN DEFAULT 1
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL CHECK(method IN ('card', 'cash', 'other')),
    card_last_four TEXT,
    card_brand TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
