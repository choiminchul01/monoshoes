"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCoupons } from "@/lib/useCoupons";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Ticket } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { AddressSearchModal } from "@/components/ui/AddressSearchModal";
import { supabase } from "@/lib/supabase";
// ... imports

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");

    const { user } = useAuth();
    const { coupons, loading: couponsLoading, calculateDiscount } = useCoupons();
    const { cartItems: allCartItems, cartTotal: cartContextTotal, clearCart, buyNowItem, deleteSelected } = useCart();

    // Determine items to checkout
    const [checkoutItems, setCheckoutItems] = useState<typeof allCartItems>([]);

    useEffect(() => {
        if (mode === "buynow") {
            if (buyNowItem) {
                setCheckoutItems([buyNowItem]);
            } else {
                // Fallback to localStorage if reload lost state
                const savedBuyNow = localStorage.getItem("buyNowItem");
                if (savedBuyNow) {
                    setCheckoutItems([JSON.parse(savedBuyNow)]);
                }
                // Don't alert - just wait or let user add items
            }
        } else {
            // Normal checkout: Use all cart items (selected or not)
            // This ensures checkout always works even if selection state is lost
            if (allCartItems.length > 0) {
                // Use selected items if any, otherwise use all items
                const selectedItems = allCartItems.filter(item => item.selected);
                if (selectedItems.length > 0) {
                    setCheckoutItems(selectedItems);
                } else {
                    // Fallback: use all cart items
                    setCheckoutItems(allCartItems.map(item => ({ ...item, selected: true })));
                }
            }
            // Don't redirect - just show empty state if cart is empty
        }
    }, [mode, buyNowItem, allCartItems, router]);

    // Calculate totals based on checkoutItems
    const checkoutTotal = checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);



    // Coupon state
    const [selectedCouponId, setSelectedCouponId] = useState<string>("");

    // ... coupon logic using checkoutTotal instead of cartTotal
    const selectedUserCoupon = coupons.find(c => c.coupon_id === selectedCouponId);
    const couponDiscount = selectedUserCoupon
        ? calculateDiscount(selectedUserCoupon.coupons, checkoutTotal)
        : 0;


    // ... rest of component


    const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
    const [isSameAsOrderer, setIsSameAsOrderer] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        customsId: ""
    });

    // Shipping Cost Logic: Default Free, +5000 for Jeju/Remote area
    const isJejuOrRemote = formData.shippingAddress && (formData.shippingAddress.includes("제주") || formData.shippingAddress.includes("도서") || formData.shippingAddress.includes("산간"));
    const shippingCost = isJejuOrRemote ? 5000 : 0;

    const finalTotal = checkoutTotal + shippingCost - couponDiscount;

    // Auto-fill user info when logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                customerEmail: user.email || "",
                customerName: user.user_metadata?.full_name || user.user_metadata?.name || "",
                customerPhone: user.user_metadata?.phone || user.phone || ""
            }));
        }
    }, [user]);

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
                customerAddressDetail: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                shippingPostalCode: data.zonecode,
                shippingAddress: data.address,
                shippingAddressDetail: ''
            }));
        }
    };

    const handleCheckout = async () => {
        // Prevent duplicate submissions
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('🚀 handleCheckout called at:', new Date().toISOString());

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
                customs_id: formData.customsId,
                total_amount: checkoutTotal,
                discount_amount: couponDiscount,
                shipping_cost: shippingCost,
                final_amount: finalTotal,
                coupon_code: selectedUserCoupon ? selectedUserCoupon.coupons.code : null,
                payment_status: 'pending' as const,
                order_status: 'pending' as const
            };

            // Save order to Supabase
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (orderError) {
                console.error('Order save failed (details):', JSON.stringify(orderError, null, 2));
                throw orderError;
            }

            console.log('✅ Order saved successfully:', order.id);

            // Mark coupon as used if applied
            if (selectedUserCoupon) {
                await supabase
                    .from('user_coupons')
                    .update({ is_used: true })
                    .eq('id', selectedUserCoupon.id);

                // Record usage history
                await supabase.from('coupon_usages').insert({
                    coupon_id: selectedUserCoupon.coupon_id,
                    user_id: user?.id || 'guest',
                    order_id: order.id,
                    discount_amount: couponDiscount
                });
            }

            // Validate product IDs are UUIDs
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
            if (checkoutItems.some(item => !uuidRegex.test(item.id))) {
                throw new Error('Invalid product IDs in cart');
            }

            // Save order items
            const orderItems = checkoutItems.map(item => ({
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
                throw itemsError;
            }

            // Clear processed items and navigate
            if (mode === 'buynow') {
                // Buy Now doesn't affect cart state usually, or optional clear
                // If we want to be strict, we don't clear cart.
            } else {
                // Clear ONLY selected items
                deleteSelected();
            }

            router.push(`/order-complete?orderNumber=${orderNumber}`);
        } catch (error: any) {
            console.error('Checkout error:', error);
            const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
            const errorDetails = error.details || error.hint || '';
            alert(`주문 처리 중 오류가 발생했습니다.\n메시지: ${errorMessage}\n${errorDetails ? `상세: ${errorDetails}` : ''}`);
            setIsSubmitting(false);
        }
    };

    // Calculate original total 
    // Calculate original total 
    // Logic removed as per new policy
    const totalProductDiscount = 0;
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
                        <Link href="/" className="text-2xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-cinzel), serif' }}>MONO SHOES</Link>
                    </div>

                    {/* Logo (Desktop) with Back Link */}
                    <div className="hidden lg:flex items-center justify-between mb-8">
                        <Link href="/" className="text-3xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-cinzel), serif' }}>MONO SHOES</Link>
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
                            <span className="font-bold">{formatPrice(finalTotal)}</span>
                        </button>

                        {isOrderSummaryOpen && (
                            <div className="mt-4 space-y-4">
                                {checkoutItems.map((item) => {
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
                                                    <span className="text-xs text-gray-400 line-through">{formatPrice(itemOriginalPrice * item.quantity)}</span>
                                                    <span className="text-xs font-bold text-red-600">-{formatPrice(itemDiscount * item.quantity)}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    );
                                })}
                                <div className="border-t border-gray-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">상품금액</span>
                                        <span className="font-medium">{formatPrice(checkoutTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">배송비</span>
                                        <span className="font-medium">{shippingCost === 0 ? "무료" : formatPrice(shippingCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                        <span>최종 결제금액</span>
                                        <span>{formatPrice(finalTotal)}</span>
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
                                placeholder="이메일 (예: monoshoes@example.com)"
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
                                        <p>예금주: <span className="font-medium text-gray-900">모노슈즈</span></p>
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
                                {totalProductDiscount > 0 && (
                                    <>

                                    </>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">주문 금액</span>
                                    <span className="font-medium text-gray-900">{formatPrice(checkoutTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">배송비</span>
                                    <span className="font-medium text-gray-900">
                                        {shippingCost === 0 ? "무료" : formatPrice(shippingCost)}
                                    </span>
                                </div>


                                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                                    {/* Only show Total Discount row if there is a discount */}
                                    {(couponDiscount > 0) && (
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">총 할인 금액</span>
                                            <span className="text-base font-bold text-red-600">
                                                -{formatPrice(couponDiscount + totalProductDiscount)}
                                            </span>
                                        </div>
                                    )}
                                    {totalProductDiscount > 0 && couponDiscount > 0 && (
                                        <div className="flex flex-col gap-1 mb-2 text-right">
                                            <span className="text-xs text-gray-500">(상품할인 -{formatPrice(totalProductDiscount)})</span>
                                            <span className="text-xs text-gray-500">(쿠폰할인 -{formatPrice(couponDiscount)})</span>
                                        </div>
                                    )}
                                    {totalProductDiscount > 0 && couponDiscount === 0 && (
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">총 할인 금액</span>
                                            <span className="text-base font-bold text-red-600">
                                                -{formatPrice(totalProductDiscount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-base font-bold text-gray-900">최종 결제금액</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-black text-white text-base font-bold rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? '처리 중...' : `${formatPrice(finalTotal)} 결제하기`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div >

            {/* Right Column: Order Summary (Desktop) */}
            < div className="hidden lg:block w-full lg:w-1/2 bg-gray-50 border-l border-gray-200 order-1 lg:order-2 h-screen sticky top-0 overflow-y-auto" >
                <div className="w-full max-w-[500px] px-10 py-16 ml-12">
                    <h2 className="text-lg font-bold tracking-wide mb-6">주문 상품</h2>
                    <div className="space-y-6">
                        {checkoutItems.map((item) => {
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
                                        <p className="text-sm font-bold text-gray-900 mt-2">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
                        {totalProductDiscount > 0 && (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">상품 원가</span>
                                    <span className="text-gray-400 line-through">{formatPrice(totalOriginalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">상품 할인</span>
                                    <span className="font-medium text-red-600">-{formatPrice(totalProductDiscount)}</span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">주문 금액</span>
                            <span className="font-medium text-gray-900">{formatPrice(checkoutTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">배송비</span>
                            <span className="font-medium text-gray-900">
                                {shippingCost === 0 ? "무료" : formatPrice(shippingCost)}
                            </span>
                        </div>
                        {shippingCost > 0 && (
                            <p className="text-xs text-gray-400">* 50만원 이상 구매 시 배송비 무료</p>
                        )}
                    </div>

                    <div className="mt-6 border-t-2 border-gray-300 pt-6">
                        {/* Only show Total Discount row if there is a discount */}
                        {(couponDiscount > 0) && (
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm text-gray-500">총 할인 금액</span>
                                <span className="text-lg font-bold text-red-600">
                                    -{formatPrice(couponDiscount + totalProductDiscount)}
                                </span>
                            </div>
                        )}
                        {totalProductDiscount > 0 && couponDiscount === 0 && (
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm text-gray-500">총 할인 금액</span>
                                <span className="text-lg font-bold text-red-600">
                                    -{formatPrice(totalProductDiscount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-base font-bold text-gray-900">최종 결제금액</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '처리 중...' : `${formatPrice(finalTotal)} 결제하기`}
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">결제 페이지를 불러오는 중...</div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
