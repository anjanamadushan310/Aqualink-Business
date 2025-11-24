-- Add cancellation reason and cancelled date time fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500),
ADD COLUMN IF NOT EXISTS cancelled_date_time TIMESTAMP;

-- Add comment to describe the columns
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason provided when an order is cancelled';
COMMENT ON COLUMN orders.cancelled_date_time IS 'Timestamp when the order was cancelled';
