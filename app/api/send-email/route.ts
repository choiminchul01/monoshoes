import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { RateLimitPresets } from '@/lib/rateLimit';
import { validateEmail, validateOrderNumber } from '@/lib/inputValidation';
import { supabase } from '@/lib/supabase';

const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not defined');
    }
    return new Resend(apiKey);
};

export async function POST(request: Request) {
    try {
        // 1. Rate limiting - 3 emails per 5 minutes
        const rateLimitResult = await RateLimitPresets.email(request);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                    }
                }
            );
        }

        const body = await request.json();
        const { email, orderNumber, orderData } = body;

        // 2. Input validation
        if (!email || !orderNumber) {
            return NextResponse.json({ error: 'Email and Order Number are required' }, { status: 400 });
        }

        if (!validateEmail(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        if (!validateOrderNumber(orderNumber)) {
            return NextResponse.json({ error: 'Invalid order number format' }, { status: 400 });
        }

        // 3. Verify order exists in database and belongs to the email
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderNumber)
            .eq('customer_email', email)
            .single();

        if (orderError || !order) {
            console.error('[Security] Invalid order lookup attempt:', { orderNumber, email });
            return NextResponse.json({ error: 'Order not found or email mismatch' }, { status: 404 });
        }

        // 4. Send email
        const { data, error } = await getResend().emails.send({
            from: 'Essentia <onboarding@resend.dev>', // Resend 기본 발신자 주소 (도메인 인증 전까지 사용)
            to: [email],
            subject: `[Essentia] 주문이 완료되었습니다. (주문번호: ${orderNumber})`,
            html: `
                <h1>주문이 완료되었습니다!</h1>
                <p>안녕하세요, Essentia입니다.</p>
                <p>고객님의 주문이 성공적으로 접수되었습니다.</p>
                <br/>
                <h2>주문 상세</h2>
                <p><strong>주문번호:</strong> ${orderNumber}</p>
                <p><strong>총 결제금액:</strong> ${order.final_amount?.toLocaleString()}원</p>
                <br/>
                <p>입금 계좌: 국민은행 123-456-789012 (예금주: 에센시아)</p>
                <p>24시간 이내에 입금해주시면 배송 준비가 시작됩니다.</p>
                <br/>
                <p>감사합니다.</p>
            `,
        });

        if (error) {
            console.error('[Email] Sending failed:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully', data });
    } catch (error) {
        console.error('[Email] Server error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
