import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const getResend = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not defined');
    }
    return new Resend(apiKey);
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, orderNumber, orderData } = body;

        if (!email || !orderNumber) {
            return NextResponse.json({ error: 'Email and Order Number are required' }, { status: 400 });
        }

        // TODO: 실제 이메일 템플릿을 더 예쁘게 꾸밀 수 있습니다.
        // 현재는 간단한 텍스트 기반으로 전송합니다.
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
                <p><strong>총 결제금액:</strong> ${orderData?.final_amount?.toLocaleString()}원</p>
                <br/>
                <p>입금 계좌: 국민은행 123-456-789012 (예금주: 에센시아)</p>
                <p>24시간 이내에 입금해주시면 배송 준비가 시작됩니다.</p>
                <br/>
                <p>감사합니다.</p>
            `,
        });

        if (error) {
            console.error('Email sending failed:', error);
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully', data });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
