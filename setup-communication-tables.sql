-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for admin-created reviews
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Can be null for admin-created reviews
    author_name TEXT, -- Display name (User's name or Custom name for admin reviews)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    image_url TEXT,
    is_admin_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inquiries Table (1:1 문의)
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('general', 'request')), -- 'general': 일반문의, 'request': 제품요청
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    answer TEXT,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notices Table (공지사항)
CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FAQs Table (자주 묻는 질문)
CREATE TABLE IF NOT EXISTS faqs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL, -- e.g., 'delivery', 'order', 'product', 'return'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Reviews Policies
CREATE POLICY "Public reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role'); -- Admin uses service role or specific logic
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Inquiries Policies
CREATE POLICY "Users can view own inquiries" ON inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inquiries" ON inquiries FOR UPDATE USING (auth.uid() = user_id);

-- Notices & FAQs Policies (Public Read, Admin Write)
CREATE POLICY "Notices are viewable by everyone" ON notices FOR SELECT USING (true);
CREATE POLICY "FAQs are viewable by everyone" ON faqs FOR SELECT USING (true);

-- Storage Buckets for Reviews and Inquiries
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inquiry-images', 'inquiry-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access Review Images" ON storage.objects FOR SELECT USING (bucket_id = 'review-images');
CREATE POLICY "Authenticated Upload Review Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete Review Images" ON storage.objects FOR DELETE USING (bucket_id = 'review-images' AND auth.uid() = owner);

CREATE POLICY "Public Access Inquiry Images" ON storage.objects FOR SELECT USING (bucket_id = 'inquiry-images');
CREATE POLICY "Authenticated Upload Inquiry Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inquiry-images' AND auth.role() = 'authenticated');
