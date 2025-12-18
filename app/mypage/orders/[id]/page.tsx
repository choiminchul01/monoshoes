"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Copy, Check, Star, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_postal_code: string;
    shipping_address: string;
    shipping_address_detail: string;
    final_amount: number;
    payment_status: string;
    order_status: string;
    tracking_number?: string;
    shipping_company?: string;
    created_at: string;
};

type OrderItem = {
    id: string;
    product_id: string;
    product_name: string;
    product_brand: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    image?: string; // Product image URL
    has_review?: boolean; // Added for frontend logic
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const toast = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderId, setOrderId] = useState<string>('');
    const [copied, setCopied] = useState(false);

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<{ productId: string, productName: string } | null>(null);

    useEffect(() => {
        params.then((resolvedParams) => {
            setOrderId(resolvedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (!authLoading && !user) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/mypage';
            router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && orderId) {
            fetchOrderDetail();
        }
    }, [user, orderId]);

    const fetchOrderDetail = async () => {
        if (!orderId) return;

        setLoading(true);

        // Fetch order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error('Order fetch error:', orderError);
            setLoading(false);
            return;
        }

        // Check if this order belongs to the current user
        if (orderData.customer_email !== user?.email) {
            router.push('/mypage');
            return;
        }

        setOrder(orderData);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (!itemsError && itemsData) {
            // Check for existing reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('product_id')
                .eq('order_id', orderId);

            const reviewedProductIds = new Set(reviewsData?.map(r => r.product_id) || []);

            const itemsWithReviewStatus = itemsData.map(item => ({
                ...item,
                has_review: reviewedProductIds.has(item.product_id)
            }));

            setOrderItems(itemsWithReviewStatus);
        }

        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'delivered': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'paid': return '입금완료';
            case 'pending': return '입금대기';
            case 'shipped': return '배송중';
            case 'delivered': return '배송완료';
            default: return status;
        }
    };

    const getTrackingUrl = (company: string, trackingNumber: string) => {
        const urls: { [key: string]: string } = {
            'CJ대한통운': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`,
            '우체국택배': `https://service.epost.go.kr/trace.RetrieveRegiPrclDeliv.comm?sid1=${trackingNumber}`,
            '한진택배': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${trackingNumber}`,
            '롯데택배': `https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=${trackingNumber}`,
        };
        return urls[company] || '#';
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
        }
    };

    const openReviewModal = (productId: string, productName: string) => {
        setReviewTarget({ productId, productName });
        setIsReviewModalOpen(true);
    };

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">주문을 찾을 수 없습니다.</p>
                    <Link href="/mypage" className="text-black underline">
                        마이페이지로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>마이페이지로 돌아가기</span>
                </Link>

                {/* Order Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">주문 상세</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.payment_status)}`}>
                            {getStatusText(order.payment_status)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">주문번호</p>
                            <p className="font-medium">{order.order_number}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">주문일시</p>
                            <p className="font-medium">
                                {new Date(order.created_at).toLocaleString('ko-KR')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">주문 상품</h2>
                    <div className="space-y-4">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                    <p className="text-sm text-gray-500">{item.product_brand}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.color} / {item.size} / 수량: {item.quantity}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                                    {order.payment_status === 'delivered' && (
                                        item.has_review ? (
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                리뷰 작성완료
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => openReviewModal(item.product_id, item.product_name)}
                                                className="text-xs font-medium text-white bg-black px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
                                            >
                                                리뷰 작성
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="font-bold">총 결제금액</span>
                        <span className="text-2xl font-bold">{formatPrice(order.final_amount)}</span>
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">배송 정보</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500">받는분</p>
                            <p className="font-medium">{order.shipping_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">연락처</p>
                            <p className="font-medium">{order.shipping_phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">배송지</p>
                            <p className="font-medium">
                                [{order.shipping_postal_code}] {order.shipping_address}
                                <br />
                                {order.shipping_address_detail}
                            </p>
                        </div>

                        {/* Tracking Information */}
                        {(order.payment_status === 'shipped' || order.payment_status === 'delivered') && order.tracking_number && order.shipping_company && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-blue-900">배송 추적</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-blue-700 mb-1">택배사</p>
                                            <p className="font-medium text-blue-900">{order.shipping_company}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-700 mb-1">송장번호</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono font-medium text-blue-900 flex-1">{order.tracking_number}</p>
                                                <button
                                                    onClick={() => copyToClipboard(order.tracking_number!)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-xs font-medium rounded hover:bg-blue-50 transition-colors"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check className="w-3 h-3" />
                                                            <span>복사됨</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            <span>복사</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <a
                                                href={getTrackingUrl(order.shipping_company, order.tracking_number)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                배송 조회하기
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Write Modal */}
            {isReviewModalOpen && reviewTarget && (
                <ReviewWriteModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={orderId}
                    productId={reviewTarget.productId}
                    productName={reviewTarget.productName}
                    onSuccess={() => {
                        setIsReviewModalOpen(false);
                        fetchOrderDetail(); // Refresh to show 'Written' status
                    }}
                />
            )}
        </div>
    );
}

function ReviewWriteModal({ isOpen, onClose, orderId, productId, productName, onSuccess }: any) {
    const toast = useToast();
    const { user } = useAuth();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("로그인이 필요합니다.");
            return;
        }
        if (!content.trim()) {
            toast.error("리뷰 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = null;
            if (image) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('review-images')
                    .upload(fileName, image);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            const { error } = await supabase.from("reviews").insert({
                user_id: user.id,
                order_id: orderId,
                product_id: productId,
                author_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                rating,
                content,
                image_url: imageUrl,
                is_admin_created: false
            });

            if (error) throw error;
            toast.success("리뷰가 등록되었습니다.");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("리뷰 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">리뷰 작성</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">상품명</p>
                    <p className="font-medium">{productName}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">평점</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black h-32 resize-none"
                            placeholder="상품에 대한 솔직한 리뷰를 남겨주세요."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">사진 첨부 (선택)</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <ImageIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-600">이미지 선택</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) setImage(e.target.files[0]);
                                    }}
                                />
                            </label>
                            {image && (
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                                    <span className="text-sm text-gray-600 truncate max-w-[150px]">{image.name}</span>
                                    <button onClick={() => setImage(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                    >
                        {isSubmitting ? "등록 중..." : "리뷰 등록하기"}
                    </button>
                </form>
            </div>
        </div>
    );
}
