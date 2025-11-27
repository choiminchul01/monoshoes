-- Enable RLS for Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access for Products (Required for Shop page)
CREATE POLICY "Public Read Access Products" ON products FOR SELECT USING (true);

-- Insert Products
INSERT INTO products (id, name, brand, price, category, images, description, stock)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Medium Leather Tote Bag', 'PRADA', 3500000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+1'], 'A study of the triangle inspires new geometric elements and novel interpretations of Prada''s historic stylistic code. The iconic shape is presented again in this shoulder bag with sleek lines that comes with a strap for versatility. The tonal embossed logo and the enameled metal triangle logo on the back enhance the minimalist aesthetics.', 100),
('550e8400-e29b-41d4-a716-446655440002', 'Re-Nylon Backpack', 'PRADA', 2800000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+2'], 'Functional and innovative, this backpack is made of Re-Nylon, a regenerated nylon yarn produced from recycled, purified plastic trash collected in the ocean, fishing nets and textile waste fibers.', 100),
('550e8400-e29b-41d4-a716-446655440003', 'Saffiano Leather Wallet', 'PRADA', 850000, 'WALLET', ARRAY['https://placehold.co/600x800/png?text=Wallet+1'], 'This Saffiano leather wallet is defined by its elegant, minimalist design. The accessory with slots for credit cards and pockets for bills and documents is decorated with the enameled metal triangle logo.', 100),
('550e8400-e29b-41d4-a716-446655440004', 'Monolith Brushed Leather Loafers', 'PRADA', 1450000, 'SHOES', ARRAY['https://placehold.co/600x800/png?text=Shoes+1'], 'The Monolith loafers made of brushed leather are characterized by the maxi rubber sole that gives the shoe a unique, modern look.', 100),
('550e8400-e29b-41d4-a716-446655440005', 'Embroidered Jersey T-shirt', 'PRADA', 1200000, 'CLOTHING', ARRAY['https://placehold.co/600x800/png?text=T-shirt+1'], 'This jersey tee features a boxy cut and is decorated with the embroidered logo.', 100),
('550e8400-e29b-41d4-a716-446655440006', 'Nylon Bucket Hat', 'PRADA', 650000, 'ACCESSORY', ARRAY['https://placehold.co/600x800/png?text=Hat+1'], 'Adorned with the iconic enameled metal triangle logo, this bucket hat is made from Re-Nylon.', 100),
('550e8400-e29b-41d4-a716-446655440007', 'Small Leather Shoulder Bag', 'PRADA', 2900000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+3'], 'This small leather shoulder bag with soft lines is decorated with the metal lettering logo.', 100),
('550e8400-e29b-41d4-a716-446655440008', 'Sunglasses', 'PRADA', 550000, 'ACCESSORY', ARRAY['https://placehold.co/600x800/png?text=Glasses+1'], 'Acetate sunglasses with a rectangular shape and bold rims.', 100),
('550e8400-e29b-41d4-a716-446655440009', 'Leather Belt', 'PRADA', 650000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Belt+1'], 'Elegant leather belt with metal buckle.', 100),
('550e8400-e29b-41d4-a716-446655440010', 'Key Trick', 'PRADA', 450000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Key+1'], 'Saffiano leather key trick.', 100),
('550e8400-e29b-41d4-a716-446655440011', 'Hair Clip', 'PRADA', 520000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Clip+1'], 'Metal hair clip with logo.', 100),
('550e8400-e29b-41d4-a716-446655440012', 'Scarf', 'PRADA', 890000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Scarf+1'], 'Cashmere scarf with embroidered logo.', 100),
('550e8400-e29b-41d4-a716-446655440013', 'Card Holder', 'PRADA', 420000, 'WALLET', ARRAY['https://placehold.co/600x600/png?text=Card+1'], 'Leather card holder.', 100),
('550e8400-e29b-41d4-a716-446655440014', 'Phone Case', 'PRADA', 580000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Case+1'], 'Leather phone case.', 100),
('550e8400-e29b-41d4-a716-446655440015', 'Headband', 'PRADA', 490000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Headband+1'], 'Nylon headband.', 100),
('550e8400-e29b-41d4-a716-446655440016', 'Bracelet', 'PRADA', 750000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Bracelet+1'], 'Leather bracelet.', 100)
ON CONFLICT (id) DO NOTHING;

-- Policies for Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);

-- Policies for Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert Order Items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Order Items" ON order_items FOR SELECT USING (true);
