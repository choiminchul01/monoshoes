import { supabaseAdmin } from '@/lib/supabase';

async function generateSampleQnA() {
  console.log('--- Generating Sample Product QnA Data ---');

  // 1. Get a sample product ID
  const { data: products, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .limit(1);

  if (productError || !products || products.length === 0) {
    console.error('Error fetching product for sample QnA:', productError);
    return;
  }

  const productId = products[0].id;
  const productName = products[0].name;
  console.log(`Using product: ${productName} (${productId})`);

  const sampleQuestions = [
    { author: '김민수', question: '사이즈가 정사이즈인가요? 발볼이 넓은 편이라서요.', is_answered: true, answer: '네, 고객님! 해당 상품은 정사이즈로 제작되었습니다. 발볼이 넓으시다면 한 사이즈 크게 주문하시는 것을 추천드립니다.' },
    { author: '이영희', question: '재입고 일정은 어떻게 되나요? 240 사이즈 사고 싶어요.', is_answered: false, answer: null },
    { author: '박지성', question: '배송 얼마나 걸릴까요? 이번주 금요일까지 받아야 해서요.', is_answered: true, answer: '일반적으로 영업일 기준 2~3일 정도 소요됩니다. 오늘 출고될 예정입니다.' },
    { author: '최유진', question: '화면에서 보는 색상이랑 실제랑 차이가 있나요?', is_answered: false, answer: null },
    { author: '정우성', question: '가죽 재질이 부드러운가요? 뒤꿈치 안 아픈지 궁금해요.', is_answered: true, answer: '천연 가죽 소재를 사용하여 매우 부드럽습니다. 뒤꿈치 부분에 쿠션 처리가 되어 있어 편안합니다.' },
    { author: '한소희', question: '선물용인데 박스 포장 신경 써주실 수 있나요?', is_answered: false, answer: null },
    { author: '이정재', question: '남성용 사이즈도 있나요?', is_answered: true, answer: '현재 해당 모델은 여성용으로만 출시되었습니다. 남성용 모델은 출시 준비 중입니다.' },
    { author: '유재석', question: '착화감이 어떤지 궁금합니다.', is_answered: false, answer: null },
  ];

  for (const item of sampleQuestions) {
    const { error } = await supabaseAdmin
      .from('product_qna')
      .insert({
        product_id: productId,
        author_name: item.author,
        question: item.question,
        answer: item.answer,
        is_answered: item.is_answered,
        is_private: false,
        answered_at: item.is_answered ? new Date().toISOString() : null,
        created_at: new Date(Date.now() - Math.random() * 1000000000).toISOString() // Random past date
      });

    if (error) {
      console.error(`Error inserting QnA by ${item.author}:`, error);
    } else {
      console.log(`Inserted QnA by ${item.author}`);
    }
  }

  console.log('--- Sample Data Generation Complete ---');
}

generateSampleQnA().catch(console.error);
