const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSeed() {
  console.log('Checking database connection...');
  
  // 1. Check existing products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*');

  if (fetchError) {
    console.error('Error fetching products:', fetchError);
    return;
  }

  console.log(`Current product count: ${products.length}`);

  if (products.length === 0) {
    console.log('No products found. Inserting a test product...');
    
    const testProduct = {
      name: '테스트 신발',
      description: '연동 확인을 위한 테스트 상품입니다.',
      price: 59000,
      category: 'NEW',
      stock_quantity: 10,
      is_active: true
    };

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert([testProduct])
      .select();

    if (insertError) {
      console.error('Error inserting test product:', insertError);
    } else {
      console.log('Test product inserted successfully:', inserted[0].name);
    }
  } else {
    console.log('Sample products already exist.');
    products.forEach(p => console.log(`- ${p.name} (${p.price}원)`));
  }
}

checkAndSeed();
