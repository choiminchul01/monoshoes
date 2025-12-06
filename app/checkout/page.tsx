"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressSearchModal } from "@/components/ui/AddressSearchModal";

export default function CheckoutPage() {
    const router = useRouter();
    const { cartItems, cartTotal, clearCart } = useCart();
    const shippingCost = cartTotal > 500000 ? 0 : 3000;

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

    // Calculate discount (mock logic - you can replace with real coupon validation)
    const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
    const finalTotal = cartTotal + shippingCost - couponDiscount;

    const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
    const [isSameAsOrderer, setIsSameAsOrderer] = useState(true); // Changed to true for better UX
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevent duplicate submissions

    // Form State
    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerPostalCode: "",
        customerAddress: "",
        customerAddressDetail: "",
        customerMemo: "",
        shippingName: "",
        shippingPhone: "",
        shippingPostalCode: "",
        shippingAddress: "",
        shippingAddressDetail: "",
        shippingMemo: "",
        customsId: "" // Added Customs ID
    });

    // Address Search State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressTarget, setAddressTarget] = useState<'customer' | 'shipping'>('customer');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddressSearch = (target: 'customer' | 'shipping') => {
        setAddressTarget(target);
        setIsAddressModalOpen(true);
    };

    const handleAddressComplete = (data: { zonecode: string; address: string }) => {
        if (addressTarget === 'customer') {
            setFormData(prev => ({
                ...prev,
                customerPostalCode: data.zonecode,
                customerAddress: data.address,
                customerAddressDetail: '' // Reset detail address
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                shippingPostalCode: data.zonecode,
                shippingAddress: data.address,
                shippingAddressDetail: '' // Reset detail address
            }));
        }
    };

    const handleApplyCoupon = () => {
        // Mock coupon validation
        const validCoupons: { [key: string]: number } = {
            "WELCOME10": 10000,
            "VIP20": 20000,
            "FIRST50": 50000,
        };

        const upperCode = couponCode.toUpperCase();
        if (validCoupons[upperCode]) {
            setAppliedCoupon({ code: upperCode, discount: validCoupons[upperCode] });
        } else {
            alert("유효하지 않은 쿠폰 코드입니다.");
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
    };

    const handleCheckout = async () => {
        // Prevent duplicate submissions
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('🚀 handleCheckout called at:', new Date().toISOString());
            console.log('📦 Cart items:', cartItems);
            console.log('💰 Cart total:', cartTotal, 'Shipping:', shippingCost, 'Final:', finalTotal);

            // Validation
            if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
                alert("주문자 정보(이름, 이메일, 연락처)는 필수 입력 사항입니다.");
                setIsSubmitting(false);
                return;
            }

            if (!isSameAsOrderer && (!formData.shippingName || !formData.shippingPhone || !formData.shippingAddress)) {
                alert("배송지 정보(이름, 연락처, 주소)를 입력해주세요.");
                setIsSubmitting(false);
                return;
            }

            // Customs ID Validation
            const customsIdRegex = /^P\d{12}$/;
            if (!customsIdRegex.test(formData.customsId)) {
                alert("개인통관고유부호를 올바르게 입력해주세요. (P로 시작하는 13자리 숫자)");
                setIsSubmitting(false);
                return;
            }

            // Generate order number
            const orderNumber = "ES" + Date.now().toString().slice(-8);

            // Prepare order data
            const orderData = {
                order_number: orderNumber,
                customer_name: formData.customerName,
                customer_email: formData.customerEmail,
                customer_phone: formData.customerPhone,
                customer_postal_code: formData.customerPostalCode,
                customer_address: formData.customerAddress,
                customer_address_detail: formData.customerAddressDetail,
                customer_memo: formData.customerMemo,
                shipping_same_as_customer: isSameAsOrderer,
                shipping_name: isSameAsOrderer ? formData.customerName : formData.shippingName,
                shipping_phone: isSameAsOrderer ? formData.customerPhone : formData.shippingPhone,
                shipping_postal_code: isSameAsOrderer ? formData.customerPostalCode : formData.shippingPostalCode,
                shipping_address: isSameAsOrderer ? formData.customerAddress : formData.shippingAddress,
                shipping_address_detail: isSameAsOrderer ? formData.customerAddressDetail : formData.shippingAddressDetail,
                shipping_memo: isSameAsOrderer ? formData.customerMemo : formData.shippingMemo,
                customs_id: formData.customsId, // Include Customs ID
                total_amount: cartTotal,
                discount_amount: couponDiscount,
                shipping_cost: shippingCost,
                final_amount: finalTotal,
                coupon_code: appliedCoupon?.code || null,
                payment_status: 'pending' as const,
                order_status: 'pending' as const
            };

            // Save order to Supabase
            const { supabase } = await import('@/lib/supabase');

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (orderError) {
                console.error('Order save failed (details):', orderError);
                alert(`주문 처리 중 오류가 발생했습니다: ${orderError.message}`);
                setIsSubmitting(false);
                return;
            }

            console.log('✅ Order saved successfully:', order.id, order.order_number);
            console.log('📋 Order data:', orderData);

            // Validate product IDs are UUIDs before inserting order items
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
            if (cartItems.some(item => !uuidRegex.test(item.id))) {
                console.error('Invalid product IDs in cart:', cartItems.map(i => i.id));
                alert('주문 처리 중 오류가 발생했습니다: 제품 ID가 올바르지 않습니다.');
                setIsSubmitting(false);
                return;
            }

            // Save order items
            const orderItems = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                product_brand: item.brand,
                quantity: item.quantity,
                price: item.price,
                color: item.color,
                size: item.size,
                image: item.image,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('주문 상품 저장 실패:', itemsError);
                alert(`주문 처리 중 오류가 발생했습니다: ${itemsError.message}`);
                setIsSubmitting(false);
                return;
            }

            // Clear cart and navigate to order complete page
            clearCart();
            router.push(`/order-complete?orderNumber=${orderNumber}`);
        } catch (error) {
            console.error('Checkout error:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };

    // Calculate original total (with 20% markup for display purposes)
    const originalTotal = Math.round(cartTotal * 1.25);
    const totalDiscount = originalTotal - cartTotal;

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">
            {/* Address Search Modal */}
            <AddressSearchModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onComplete={handleAddressComplete}
            />

            {/* Left Column: Information & Payment */}
            <div className="w-full lg:w-1/2 flex justify-end order-2 lg:order-1">
                <div className="w-full max-w-[600px] px-4 py-8 lg:px-8 lg:py-16">
                    {/* Logo (Mobile only) */}
                    <div className="lg:hidden mb-6 text-center">
                        <Link href="/" className="text-2xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-cinzel), serif' }}>ESSENTIA</Link>
                    </div>

                    {/* Logo (Desktop) with Back Link */}
                    <div className="hidden lg:flex items-center justify-between mb-8">
                        <Link href="/" className="text-3xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-cinzel), serif' }}>ESSENTIA</Link>
                        <Link href="/cart" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            장바구니로 돌아가기
                        </Link>
                    </div>

                    {/* Mobile Order Summary Toggle */}
                    <div className="lg:hidden mb-8 border-y border-gray-200 py-4">
                        <button
                            onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                            className="w-full flex justify-between items-center text-sm text-black"
                        >
                            <span className="flex items-center gap-2 text-black font-medium">
                                주문 요약 보기 <ChevronDown className={`w-4 h-4 transition-transform ${isOrderSummaryOpen ? "rotate-180" : ""}`} />
                            </span>
                            <span className="font-bold">{finalTotal.toLocaleString()}원</span>
                        </button>

                        {isOrderSummaryOpen && (
                            <div className="mt-4 space-y-4">
                                {cartItems.map((item) => {
                                    const itemOriginalPrice = Math.round(item.price * 1.25);
                                    const itemDiscount = itemOriginalPrice - item.price;
                                    return (
                                        <div key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4">
                                            <div className="relative w-16 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                <span className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                                                <p className="text-xs text-gray-500">{item.brand} / {item.color} / {item.size}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-400 line-through">{(itemOriginalPrice * item.quantity).toLocaleString()}원</span>
                                                    <span className="text-xs font-bold text-red-600">-{itemDiscount.toLocaleString()}원</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{(item.price * item.quantity).toLocaleString()}원</p>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-gray-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">상품금액</span>
                                        <span className="font-medium">{cartTotal.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">배송비</span>
                                        <span className="font-medium">{shippingCost === 0 ? "무료" : `${shippingCost.toLocaleString()}원`}</span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>쿠폰 할인</span>
                                            <span className="font-medium">-{couponDiscount.toLocaleString()}원</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                        <span>최종 결제금액</span>
                                        <span>{finalTotal.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
                        <Link href="/cart" className="hover:text-black transition-colors">장바구니</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-black font-medium">주문/결제</span>
                    </nav>

                    {/* Contact & Orderer Information */}
                    <section className="mb-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">주문자 정보</h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                placeholder="이름 (예: 이몽룡)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                            />
                            <input
                                type="email"
                                name="customerEmail"
                                value={formData.customerEmail}
                                onChange={handleInputChange}
                                placeholder="이메일 (예: essentia@example.com)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                            />
                            <input
                                type="tel"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleInputChange}
                                placeholder="연락처 (예: 010-1234-5678)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="customerPostalCode"
                                    value={formData.customerPostalCode}
                                    onChange={handleInputChange}
                                    placeholder="우편번호"
                                    readOnly
                                    className="flex-1 h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-gray-50"
                                />
                                <button
                                    onClick={() => openAddressSearch('customer')}
                                    className="px-4 h-12 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                                >
                                    주소 검색
                                </button>
                            </div>
                            <input
                                type="text"
                                name="customerAddress"
                                value={formData.customerAddress}
                                onChange={handleInputChange}
                                placeholder="주소"
                                readOnly
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-gray-50"
                            />
                            <input
                                type="text"
                                name="customerAddressDetail"
                                value={formData.customerAddressDetail}
                                onChange={handleInputChange}
                                placeholder="상세주소 (예: 101동 1001호)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                            />
                            <input
                                type="text"
                                name="customerMemo"
                                value={formData.customerMemo}
                                onChange={handleInputChange}
                                placeholder="배송 메모 (선택사항)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                            />
                        </div>
                    </section>

                    {/* Shipping Address */}
                    <section className="mb-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">배송지 정보</h2>

                        {/* Same as Orderer Checkbox */}
                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sameAsOrderer"
                                checked={isSameAsOrderer}
                                onChange={(e) => setIsSameAsOrderer(e.target.checked)}
                                className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            <label htmlFor="sameAsOrderer" className="text-sm text-gray-700 cursor-pointer font-medium">
                                주문자 정보와 동일
                            </label>
                        </div>

                        {/* Shipping Address Fields (shown when not same as orderer) */}
                        {!isSameAsOrderer && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <p className="text-xs text-gray-500 mb-3">받으시는 분의 정보를 입력해주세요.</p>
                                <input
                                    type="text"
                                    name="shippingName"
                                    value={formData.shippingName}
                                    onChange={handleInputChange}
                                    placeholder="수령인 이름 (예: 성춘향)"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-white"
                                />
                                <input
                                    type="tel"
                                    name="shippingPhone"
                                    value={formData.shippingPhone}
                                    onChange={handleInputChange}
                                    placeholder="수령인 연락처 (예: 010-1234-5678)"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-white"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="shippingPostalCode"
                                        value={formData.shippingPostalCode}
                                        onChange={handleInputChange}
                                        placeholder="우편번호"
                                        readOnly
                                        className="flex-1 h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-gray-100"
                                    />
                                    <button
                                        onClick={() => openAddressSearch('shipping')}
                                        className="px-4 h-12 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                                    >
                                        주소 검색
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    name="shippingAddress"
                                    value={formData.shippingAddress}
                                    onChange={handleInputChange}
                                    placeholder="주소"
                                    readOnly
                                    className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-gray-100"
                                />
                                <input
                                    type="text"
                                    name="shippingAddressDetail"
                                    value={formData.shippingAddressDetail}
                                    onChange={handleInputChange}
                                    placeholder="상세주소 (예: 101동 1001호)"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-white"
                                />
                                <input
                                    type="text"
                                    name="shippingMemo"
                                    value={formData.shippingMemo}
                                    onChange={handleInputChange}
                                    placeholder="배송 메모 (선택사항)"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm bg-white"
                                />
                            </div>
                        )}

                        {/* Customs ID Input (Always shown in Shipping Section) */}
                        <div className="mt-4">
                            <label htmlFor="customsId" className="block text-sm font-medium text-gray-700 mb-1">
                                개인통관고유부호 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customsId"
                                value={formData.customsId}
                                onChange={handleInputChange}
                                placeholder="P로 시작하는 13자리 숫자 (예: P123456789012)"
                                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm"
                                maxLength={13}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                * 해외 배송을 위해 필수 입력 사항입니다.
                                <a href="https://unipass.customs.go.kr/csp/persIndex.do" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 underline">
                                    발급받기
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* Coupon Section */}
                    <section className="mb-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">할인 쿠폰</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="쿠폰 코드 입력 (예: WELCOME10)"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                                className="flex-1 h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 text-sm disabled:bg-gray-100"
                            />
                            {!appliedCoupon ? (
                                <button
                                    onClick={handleApplyCoupon}
                                    className="px-6 h-12 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                                >
                                    적용
                                </button>
                            ) : (
                                <button
                                    onClick={handleRemoveCoupon}
                                    className="px-6 h-12 bg-gray-500 text-white text-sm font-bold rounded-md hover:bg-gray-600 transition-colors whitespace-nowrap"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                        {appliedCoupon && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-800">
                                    <span className="font-bold">{appliedCoupon.code}</span> 쿠폰이 적용되었습니다.
                                    <span className="font-bold ml-1">{appliedCoupon.discount.toLocaleString()}원</span> 할인!
                                </p>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            * 사용 가능한 쿠폰: WELCOME10 (10,000원), VIP20 (20,000원), FIRST50 (50,000원)
                        </p>
                    </section>

                    {/* Payment Method */}
                    <section className="mb-10">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">결제 수단</h2>
                        <div className="space-y-3">
                            <div className="border border-gray-300 rounded-md p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="radio"
                                        id="bankTransfer"
                                        name="paymentMethod"
                                        defaultChecked
                                        className="text-black focus:ring-black"
                                    />
                                    <label htmlFor="bankTransfer" className="text-sm font-medium text-gray-900 cursor-pointer">
                                        무통장 입금
                                    </label>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm">
                                    <p className="font-medium text-gray-900 mb-2">입금 계좌 안내</p>
                                    <div className="space-y-1 text-gray-600">
                                        <p>은행: <span className="font-medium text-gray-900">국민은행</span></p>
                                        <p>계좌번호: <span className="font-medium text-gray-900">123-456-789012</span></p>
                                        <p>예금주: <span className="font-medium text-gray-900">에센시아</span></p>
                                    </div>
                                    <p className="mt-3 text-xs text-gray-500">
                                        * 주문 후 24시간 이내 미입금 시 자동 취소됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mobile Checkout Summary & Button (Below Payment Method) */}
                    <section className="lg:hidden mb-10">
                        <div className="border border-gray-200 rounded-md p-6 bg-gray-50">
                            <h3 className="text-base font-bold text-gray-900 mb-4">결제 금액</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">상품 원가</span>
                                    <span className="text-gray-400 line-through">{originalTotal.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">상품 할인</span>
                                    <span className="font-medium text-red-600">-{totalDiscount.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">상품 금액</span>
                                    <span className="font-medium text-gray-900">{cartTotal.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">배송비</span>
                                    <span className="font-medium text-gray-900">
                                        {shippingCost === 0 ? "무료" : `${shippingCost.toLocaleString()}원`}
                                    </span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">쿠폰 할인</span>
                                        <span className="font-medium text-red-600">-{couponDiscount.toLocaleString()}원</span>
                                    </div>
                                )}
                                {shippingCost > 0 && (
                                    <p className="text-xs text-gray-500">* 50만원 이상 구매 시 배송비 무료</p>
                                )}

                                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">총 할인 금액</span>
                                        <span className="text-base font-bold text-red-600">
                                            -{(totalDiscount + couponDiscount).toLocaleString()}원
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-base font-bold text-gray-900">최종 결제금액</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900">{finalTotal.toLocaleString()}</span>
                                            <span className="text-sm text-gray-600 ml-1">원</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-black text-white text-base font-bold rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? '처리 중...' : `${finalTotal.toLocaleString()}원 결제하기`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Right Column: Order Summary (Desktop) */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gray-50 border-l border-gray-200 order-1 lg:order-2 h-screen sticky top-0 overflow-y-auto">
                <div className="w-full max-w-[500px] px-10 py-16 ml-12">
                    <h2 className="text-lg font-bold tracking-wide mb-6">주문 상품</h2>
                    <div className="space-y-6">
                        {cartItems.map((item) => {
                            const itemOriginalPrice = Math.round(item.price * 1.25);
                            const itemDiscount = itemOriginalPrice - item.price;
                            return (
                                <div key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4 items-start">
                                    <div className="relative w-16 h-20 bg-white rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{item.brand} / {item.color} / {item.size}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-400 line-through">{(itemOriginalPrice * item.quantity).toLocaleString()}원</span>
                                            <span className="text-xs font-bold text-red-600">-{(itemDiscount * item.quantity).toLocaleString()}원</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                            {(item.price * item.quantity).toLocaleString()}원
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">상품 원가</span>
                            <span className="text-gray-400 line-through">{originalTotal.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">상품 할인</span>
                            <span className="font-medium text-red-600">-{totalDiscount.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">배송비</span>
                            <span className="font-medium text-gray-900">
                                {shippingCost === 0 ? "무료" : `${shippingCost.toLocaleString()}원`}
                            </span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">쿠폰 할인</span>
                                <span className="font-medium text-red-600">-{couponDiscount.toLocaleString()}원</span>
                            </div>
                        )}
                        {shippingCost > 0 && (
                            <p className="text-xs text-gray-400">* 50만원 이상 구매 시 배송비 무료</p>
                        )}
                    </div>

                    <div className="mt-6 border-t-2 border-gray-300 pt-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm text-gray-500">총 할인 금액</span>
                            <span className="text-lg font-bold text-red-600">
                                -{(totalDiscount + couponDiscount).toLocaleString()}원
                            </span>
                        </div>
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-base font-bold text-gray-900">최종 결제금액</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">{finalTotal.toLocaleString()}</span>
                                <span className="text-sm text-gray-500 ml-1">원</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '처리 중...' : `${finalTotal.toLocaleString()}원 결제하기`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
