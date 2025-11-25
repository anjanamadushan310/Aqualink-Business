-- Check if sold_count column exists in fish_ads table
DESCRIBE fish_ads;

-- Check current sold_count values
SELECT id, name, stock, sold_count FROM fish_ads;

-- Check if sold_count column exists in industrial_stuff table
DESCRIBE industrial_stuff;

-- Check current sold_count values for industrial stuff
SELECT id, name, stock, sold_count FROM industrial_stuff;

-- Check delivered orders
SELECT o.id, o.order_status, oi.product_id, oi.product_type, oi.quantity
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_status = 'DELIVERED';

-- If sold_count column doesn't exist, add it:
-- ALTER TABLE fish_ads ADD COLUMN sold_count INT DEFAULT 0;
-- ALTER TABLE industrial_stuff ADD COLUMN sold_count INT DEFAULT 0;
