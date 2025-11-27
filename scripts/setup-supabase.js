#!/usr/bin/env node

/**
 * Supabase 자동 설정 스크립트
 * Storage 버킷 생성 및 설정을 자동화합니다
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 색상 출력 헬퍼
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n🚀 Supabase 자동 설정 시작\n', 'cyan');

    // 1. 환경 변수 검증
    log('1. 환경 변수 검증 중...', 'blue');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        log('❌ 환경 변수가 설정되지 않았습니다!', 'red');
        log('\n.env.local 파일에 다음 변수를 설정하세요:', 'yellow');
        log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co', 'yellow');
        log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n', 'yellow');
        process.exit(1);
    }

    log(`✅ Supabase URL: ${SUPABASE_URL}`, 'green');
    log(`✅ Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`, 'green');

    // Service Role Key는 선택사항
    if (SUPABASE_SERVICE_KEY) {
        log(`✅ Service Role Key: 설정됨`, 'green');
    } else {
        log(`⚠️  Service Role Key: 설정되지 않음 (선택사항)`, 'yellow');
    }

    // 2. Supabase 클라이언트 생성
    log('\n2. Supabase 연결 테스트 중...', 'blue');

    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
    );

    // 3. 데이터베이스 연결 테스트
    try {
        const { data, error } = await supabase.from('products').select('count').limit(1);

        if (error) {
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                log('⚠️  products 테이블이 아직 생성되지 않았습니다', 'yellow');
                log('   setup-database.sql 파일을 Supabase SQL Editor에서 실행하세요', 'yellow');
            } else {
                throw error;
            }
        } else {
            log('✅ 데이터베이스 연결 성공', 'green');
        }
    } catch (err) {
        log(`❌ 데이터베이스 연결 실패: ${err.message}`, 'red');
    }

    // 4. Storage 버킷 확인 및 생성
    log('\n3. Storage 버킷 확인 중...', 'blue');

    try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            log(`⚠️  버킷 목록 조회 실패: ${listError.message}`, 'yellow');
            log('   Service Role Key가 필요할 수 있습니다', 'yellow');
        } else {
            const productImagesBucket = buckets.find(b => b.name === 'product-images');

            if (productImagesBucket) {
                log('✅ product-images 버킷이 이미 존재합니다', 'green');
                log(`   Public: ${productImagesBucket.public ? '예' : '아니오'}`, 'cyan');
            } else {
                log('⚠️  product-images 버킷이 존재하지 않습니다', 'yellow');
                log('\n   Supabase 대시보드에서 수동으로 생성하세요:', 'yellow');
                log('   1. Storage 메뉴로 이동', 'yellow');
                log('   2. "Create a new bucket" 클릭', 'yellow');
                log('   3. 버킷 이름: product-images', 'yellow');
                log('   4. Public bucket: 체크 ✅', 'yellow');
                log('\n   또는 setup-storage.md 파일을 참고하세요\n', 'yellow');
            }
        }
    } catch (err) {
        log(`⚠️  Storage 확인 중 오류: ${err.message}`, 'yellow');
    }

    // 5. 완료
    log('\n✅ 설정 확인 완료!\n', 'green');
    log('다음 단계:', 'cyan');
    log('1. setup-database.sql 파일을 Supabase SQL Editor에서 실행', 'cyan');
    log('2. setup-storage.md 파일을 참고하여 Storage 버킷 생성', 'cyan');
    log('3. npm run dev로 개발 서버 시작', 'cyan');
    log('4. http://localhost:3000/admin/products에서 상품 관리 테스트\n', 'cyan');
}

main().catch(err => {
    log(`\n❌ 오류 발생: ${err.message}\n`, 'red');
    process.exit(1);
});
