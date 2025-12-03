/**
 * Test script for API Rate Limiting
 * Run with: node scripts/test-rate-limit.js
 */

// const fetch = require('node-fetch'); // Using built-in fetch

// Base URL - assuming local dev server
const BASE_URL = 'http://localhost:3000';

async function testRateLimit() {
    console.log('🚦 Testing Rate Limiting...\n');

    // Test Email API Rate Limit
    console.log('Test 1: Testing Email API Rate Limit (Limit: 3 per 5 min)');

    const emailEndpoint = `${BASE_URL}/api/send-email`;
    const payload = {
        email: 'test@example.com',
        orderNumber: 'TEST-ORDER-123', // This might fail validation but should hit rate limit first or after validation
        // We want to hit the rate limit, so the payload validity matters less than the count
    };

    let successCount = 0;
    let blockedCount = 0;

    for (let i = 1; i <= 10; i++) {
        try {
            const response = await fetch(emailEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log(`Request ${i}: Status ${response.status}`);

            if (response.status === 429) {
                blockedCount++;
                console.log('   ✅ Blocked by Rate Limiter');
            } else if (response.status === 200 || response.status === 400 || response.status === 404 || response.status === 500) {
                // 400/404/500 are also "success" in terms of bypassing rate limit
                successCount++;
            }
        } catch (error) {
            console.error(`   Request ${i} failed:`, error.message);
        }

        // Small delay to prevent network congestion issues (not rate limit)
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\nResults:');
    console.log(`Passed: ${successCount}`);
    console.log(`Blocked: ${blockedCount}`);

    if (blockedCount > 0) {
        console.log('\n✅ PASS: Rate Limiter is working');
    } else {
        console.log('\n❌ FAIL: Rate Limiter did not block any requests (or limit is higher than tested)');
    }
}

// Check if fetch is available (Node 18+)
if (!globalThis.fetch) {
    console.error('❌ This script requires Node.js 18+ or node-fetch');
    process.exit(1);
}

testRateLimit();
