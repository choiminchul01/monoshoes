const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables!");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function generateReviews() {
    console.log("Starting review generation...");
    
    // 0. Delete existing admin reviews to avoid mess
    const { error: deleteError } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('is_admin_created', true);
    
    if (deleteError) {
        console.error("Error deleting existing reviews:", deleteError);
    } else {
        console.log("Deleted existing admin reviews.");
    }

    // 1. Fetch all products
    const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, images');

    if (productError) {
        console.error("Error fetching products:", productError);
        return;
    }

    if (!products || products.length === 0) {
        console.log("No products found.");
        return;
    }

    console.log(`Found ${products.length} products. Generating reviews...`);

    const authorNames = ["김민준", "이서연", "박지민", "최유진", "정하윤", "강도윤", "조수아", "윤준서", "한지아", "오건우", "임소윤", "신도현", "박준영", "이지혜", "최성민", "김나래", "정진우", "유하은"];
    
    const openers = [
        "와 진짜 대박이에요.", "기대 이상입니다!", "고민하다 샀는데 만족스러워요.", "배송 정말 빠르네요.", "포장이 아주 꼼꼼해요.",
        "실물이 훨씬 예뻐요.", "역시 믿고 사는 브랜드네요.", "딱 원하던 스타일입니다.", "색깔이 너무 잘 나왔어요.", "유튜브 보고 샀는데 좋네요."
    ];
    const features = [
        "착용감이 너무 좋아서 놀랐어요.", "디자인이 아주 깔끔하고 세련됐어요.", "발볼이 넓은 편인데도 편안하네요.", "가죽이 부드러워서 발이 안 아파요.", "색감이 사진보다 훨씬 예쁩니다.",
        "오래 걸어도 발이 피로하지 않아요.", "쿠션감이 아주 적당해서 좋네요.", "박음질도 꼼꼼하고 퀄리티 대박입니다.", "슬랙스나 청바지 어디든 잘 어울려요.", "가벼워서 날아갈 것 같아요."
    ];
    const closers = [
        "앞으로 여기서만 주문할게요.", "다른 색상도 하나 더 사야겠어요.", "선물용으로도 좋을 것 같아요.", "강추합니다!", "번창하세요~",
        "동생 주려고 샀는데 제가 신고 싶어요.", "품절되기 전에 얼른 사세요!", "가격 대비 최고입니다.", "주변 사람들에게 추천 중이에요.", "재구매 의사 200%입니다."
    ];

    const reviewsToInsert = [];

    for (const product of products) {
        let imageUrl = null;
        if (product.images && product.images.length >= 3) {
            imageUrl = product.images[Math.floor(Math.random() * 2) + 1];
        } else if (product.images && product.images.length >= 2) {
            imageUrl = product.images[1];
        } else if (product.images && product.images.length >= 1) {
            imageUrl = product.images[0];
        }

        const authorName = authorNames[Math.floor(Math.random() * authorNames.length)];
        
        // Pick random components to create a unique sentence
        const op = openers[Math.floor(Math.random() * openers.length)];
        const fe = features[Math.floor(Math.random() * features.length)];
        const cl = closers[Math.floor(Math.random() * closers.length)];
        
        const content = `${product.name} ${op} ${fe} ${cl}`;
        const rating = Math.floor(Math.random() * 2) + 4;

        reviewsToInsert.push({
            product_id: product.id,
            author_name: authorName,
            rating: rating,
            content: content,
            image_url: imageUrl,
            is_admin_created: true,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
        });
    }

    const { error: insertError } = await supabaseAdmin
        .from('reviews')
        .insert(reviewsToInsert);

    if (insertError) {
        console.error("Error inserting reviews:", insertError);
    } else {
        console.log(`Successfully generated ${reviewsToInsert.length} unique reviews.`);
    }
}

generateReviews().catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});


