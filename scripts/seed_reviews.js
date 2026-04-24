require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const reviewContents = [
    '정말 편하고 디자인도 마음에 듭니다! 정사이즈 추천해요.',
    '발볼이 넓은 편인데도 하루종일 신고 다녀도 발이 안 아프네요. 최고!',
    '배송도 빠르고 포장도 꼼꼼해서 선물용으로도 좋을 것 같아요.',
    '사진이랑 실물이 똑같아요. 캐주얼에도 정장에도 잘 어울립니다.',
    '가죽 퀄리티가 정말 좋네요. 이 가격에 이 퀄리티라니 놀랍습니다.',
    '조금 크다는 리뷰를 봤는데 저는 딱 맞았어요. 너무 예쁩니다.',
    '키높이 효과도 있고 비율이 좋아보여요. 데일리 슈즈로 당첨!',
    '쿠션감이 좋아서 오래 걸어도 피로하지 않아요. 부모님도 하나 사드리려고요.',
    '색상이 화면보다 아주 살짝 어둡지만 오히려 고급스럽고 예쁘네요.',
    '디자인이 미니멀해서 매일 신어도 질리지 않을 것 같아요. 강력 추천합니다.'
];

const authorNames = ['김지민', '이서연', '박준호', '최은정', '정민우', '강민지', '윤성호', '조은아', '임현우', '송가영'];

const imagePool = [
    '/images/reviews/shoes_feet.png',
    '/images/reviews/shoes_box.png'
];

async function seedReviews() {
    console.log('Seeding realistic reviews...');
    
    // Check if table exists
    const { error: checkError } = await supabase.from('reviews').select('id').limit(1);
    if (checkError) {
        console.error('Error: reviews table does not exist yet!', checkError.message);
        return;
    }

    const { data: products } = await supabase.from('products').select('id').limit(10);
    if (!products || products.length === 0) {
        console.error('No products found to attach reviews to.');
        return;
    }

    const reviewsToInsert = [];
    for (let i = 0; i < 10; i++) {
        const product = products[i % products.length];
        reviewsToInsert.push({
            product_id: product.id,
            author_name: authorNames[i],
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            content: reviewContents[i],
            image_url: Math.random() > 0.5 ? imagePool[Math.floor(Math.random() * imagePool.length)] : null, // 50% chance of having an image
            is_admin_created: true,
            created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    const { error } = await supabase.from('reviews').insert(reviewsToInsert);
    if (error) {
        console.error('Insert error:', error.message);
    } else {
        console.log('Successfully inserted 10 realistic reviews!');
    }
}

seedReviews();
