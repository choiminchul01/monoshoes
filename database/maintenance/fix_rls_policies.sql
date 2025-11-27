-- Enable DELETE for orders
CREATE POLICY "Public Delete Orders" ON orders FOR DELETE USING (true);

-- Enable DELETE for order_items
CREATE POLICY "Public Delete Order Items" ON order_items FOR DELETE USING (true);

-- Enable UPDATE for orders (for payment status updates)
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
