const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envMap = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envMap[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = envMap['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envMap['SUPABASE_SERVICE_ROLE_KEY'] || envMap['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const staticEvents = [
    { image_url: "/images/event/97_7.jpg", title: "쇼핑위크", description: "2026.03.25 ~ 2026.04.30", event_date: "2026-03-25", is_active: true },
    { image_url: "/images/event/97_11.jpg", title: "26SS 커리우먼 NEW", description: "2026.04.20 ~ 2026.05.04", event_date: "2026-04-20", is_active: true },
    { image_url: "/images/event/97_15.jpg", title: "봄맞이 특별할인", description: "2026.02.23 ~ 2026.03.31", event_date: "2026-02-23", is_active: true },
    { image_url: "/images/event/97_19.jpg", title: "토스페이 프로모션", description: "2025.09.17 ~ 2026.03.17", event_date: "2025-09-17", is_active: true },
    { image_url: "/images/event/97_23.jpg", title: "시즌오프", description: "2026.02.06 ~ 2026.02.27", event_date: "2026-02-06", is_active: true },
    { image_url: "/images/event/97_27.jpg", title: "설맞이 쿠폰전", description: "2026.02.09 ~ 2026.02.19", event_date: "2026-02-09", is_active: true },
    { image_url: "/images/event/97_31.jpg", title: "설준비 쿠폰전", description: "2026.01.26 ~ 2026.02.09", event_date: "2026-01-26", is_active: true },
    { image_url: "/images/event/97_35.jpg", title: "NEW YEAR 15% 쿠폰", description: "2026.01.02 ~ 2026.01.30", event_date: "2026-01-02", is_active: true },
    { image_url: "/images/event/97_39.jpg", title: "WINTER", description: "기간 2025.12.01 ~ 2025.12.31", event_date: "2025-12-01", is_active: false },
    { image_url: "/images/event/97_43.jpg", title: "쿠폰 위크", description: "2025.11.03 ~ 2025.11.14", event_date: "2025-11-03", is_active: false },
    { image_url: "/images/event/97_47.jpg", title: "추석맞이 쿠폰 FESTA", description: "2025.10.01 ~ 2025.10.13", event_date: "2025-10-01", is_active: false },
    { image_url: "/images/event/97_51.jpg", title: "9월 슈즈 데이", description: "기간 2025.09.01 ~ 2025.09.30", event_date: "2025-09-01", is_active: false },
    { image_url: "/images/event/97_55.jpg", title: "S/S 시즌 오프", description: "기간 2025.09.01 ~ 2025.09.30", event_date: "2025-09-01", is_active: false }
];

async function seed() {
    console.log('Seeding events...');
    const { data, error } = await supabase.from('events').insert(staticEvents);
    if (error) {
        console.error('Error inserting events:', error);
    } else {
        console.log('Successfully inserted events!');
    }
}
seed();
