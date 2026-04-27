
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const NAMES = [
    "김지안", "이하늘", "박서준", "최다인", "정민호", "강은채", "조유나", "윤도현", "임서윤", "한승우",
    "오지수", "서준영", "송민지", "유하람", "신도윤", "권예슬", "황민재", "안서연", "배진우", "고하은",
    "양시후", "전예원", "심도경", "남윤서", "성민규", "차은우", "주아린", "노현우", "문지후", "곽서연",
    "최민철", "이지은", "박진성", "김소희", "정우진", "이수아", "김동현", "박채원", "이서호", "한유진"
];

const COMMENTS = [
    "정말 편해요! 하루 종일 신고 다녀도 발이 하나도 안 아프네요.",
    "디자인이 너무 세련됐어요. 친구들이 다 어디서 샀냐고 물어보네요.",
    "배송도 빠르고 포장도 꼼꼼해서 기분 좋게 받았습니다.",
    "색감이 화면보다 훨씬 고급스러워요. 대만족입니다!",
    "사이즈도 딱 맞고 가벼워서 데일리로 신기 너무 좋네요.",
    "가죽 질감이 정말 부드러워요. 이 가격에 이 퀄리티라니 믿기지 않네요.",
    "결혼식 때 신으려고 샀는데 너무 고급지고 예뻐요.",
    "굽 높이도 적당해서 부담 없이 신을 수 있을 것 같아요.",
    "수제화 느낌이 물씬 나네요. 마감 처리가 정말 깔끔합니다.",
    "기대 이상입니다. 다음에도 여기서 구매할게요!",
    "인생 신발 찾았어요. 발 볼이 넓은 편인데도 편안하게 잘 맞네요.",
    "슬랙스나 청바지 어디에나 잘 어울려서 코디하기 편해요.",
    "가성비 끝판왕이네요. 다른 색상도 구매하고 싶어요.",
    "여름에 신기 딱 좋은 소재네요. 통기성도 좋고 시원합니다.",
    "엄마 선물로 드렸는데 너무 좋아하시네요. 효도템 추천!",
    "걸을 때 소음도 적고 바닥 쿠션감이 좋아서 피로감이 덜해요.",
    "모노슈즈 역시 믿고 구매합니다. 항상 실망시키지 않네요.",
    "깔끔한 디자인 찾고 있었는데 딱 제 스타일입니다.",
    "어두운 옷에 포인트 주기에 너무 좋아요. 예쁘다는 소리 많이 들었어요.",
    "착화감이 예술입니다. 발을 감싸주는 느낌이 너무 좋네요."
];

async function seed() {
    console.log("Starting full review re-sync...");

    // 1. Delete all existing reviews
    const { error: deleteError } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.error("Error deleting reviews:", deleteError);
        return;
    }
    console.log("Cleared existing reviews.");

    // 2. Fetch all products
    const { data: products, error: productError } = await supabase.from('products').select('id, name, images');
    if (productError) {
        console.error("Error fetching products:", productError);
        return;
    }

    const newReviews = [];

    for (const product of products) {
        // Use 2nd or 3rd image for review (index 1 or 2)
        let reviewImageUrl = null;
        if (product.images && product.images.length > 1) {
            reviewImageUrl = product.images[Math.min(product.images.length - 1, Math.floor(Math.random() * 2) + 1)];
        } else if (product.images && product.images.length > 0) {
            reviewImageUrl = product.images[0];
        }

        // Generate 3-5 reviews per product
        const count = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < count; i++) {
            const author = NAMES[Math.floor(Math.random() * NAMES.length)];
            const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
            const rating = Math.random() > 0.3 ? 5 : 4; // Mostly 5, some 4

            newReviews.push({
                product_id: product.id,
                author_name: author,
                rating: rating,
                content: `${product.name} ${comment}`,
                image_url: i === 0 ? reviewImageUrl : null, // Only first review of each product has image for variety
                is_admin_created: true,
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date in last 30 days
            });
        }
    }

    // 3. Insert new reviews
    const { error: insertError } = await supabase.from('reviews').insert(newReviews);
    if (insertError) {
        console.error("Error inserting reviews:", insertError);
    } else {
        console.log(`Successfully synced ${newReviews.length} professional reviews.`);
    }
}

seed();
