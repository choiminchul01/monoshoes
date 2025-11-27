
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyProduct = {
    name: 'Essentia Classic T-Shirt',
    brand: 'Essentia',
    price: 45000,
    category: 'T-Shirts',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    description: 'A classic t-shirt made from 100% organic cotton. Perfect for everyday wear.',
    stock: 100,
    is_available: true,
    details: {
        colors: [
            { name: 'Black', value: '#000000' },
            { name: 'White', value: '#FFFFFF' },
            { name: 'Navy', value: '#000080' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        features: ['100% Organic Cotton', 'Regular Fit', 'Machine Washable']
    }
};

async function seedProduct() {
    console.log('Seeding product...');

    const { data, error } = await supabase
        .from('products')
        .insert([dummyProduct])
        .select();

    if (error) {
        console.error('Error seeding product:', error);
    } else {
        console.log('Product seeded successfully:', data);
    }
}

seedProduct();
