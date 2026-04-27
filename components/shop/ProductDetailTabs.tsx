"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import ProductQnA from "@/components/product/ProductQnA";

type Product = {
    id: string;
    name: string;
    brand: string;
    detail_images?: string[];
    category?: string;
};

type Review = {
    id: string;
    author_name: string;
    rating: number;
    content: string;
    image_url: string | null;
    created_at: string;
    is_admin_created?: boolean;
};

interface ProductDetailTabsProps {
    product: Product;
    relatedProducts?: any[];
}

const SHOE_SIZES_TABLE = [
    { mm: "225", uk: "3.5", eu: "35.5", us_women: "5", us_men: "-" },
    { mm: "230", uk: "4", eu: "36", us_women: "5.5", us_men: "-" },
    { mm: "235", uk: "4.5", eu: "36.5", us_women: "6", us_men: "-" },
    { mm: "240", uk: "5", eu: "37.5", us_women: "6.5", us_men: "6" },
    { mm: "245", uk: "5.5", eu: "38", us_women: "7", us_men: "6.5" },
    { mm: "250", uk: "6", eu: "38.5", us_women: "7.5", us_men: "7" },
    { mm: "255", uk: "6.5", eu: "39", us_women: "8", us_men: "7.5" },
    { mm: "260", uk: "7", eu: "40", us_women: "8.5", us_men: "8" },
    { mm: "265", uk: "7.5", eu: "40.5", us_women: "9", us_men: "8.5" },
    { mm: "270", uk: "8", eu: "41", us_women: "9.5", us_men: "9" },
    { mm: "275", uk: "8.5", eu: "42", us_women: "10", us_men: "9.5" },
    { mm: "280", uk: "9", eu: "42.5", us_women: "10.5", us_men: "10" },
    { mm: "285", uk: "9.5", eu: "43", us_women: "11", us_men: "10.5" },
    { mm: "290", uk: "10", eu: "44", us_women: "11.5", us_men: "11" },
];

const TABS = [
    { id: "detail", label: "상품 상세" },
    { id: "review", label: "리뷰" },
    { id: "size-guide", label: "사이즈 가이드" },
    { id: "delivery", label: "배송·교환·반품" },
    { id: "qna", label: "Q&A" },
];

export default function ProductDetailTabs({ product }: ProductDetailTabsProps) {
    const [activeTab, setActiveTab] = useState("detail");

    return (
        <div id="size-guide-tab" className="mt-24 border-t border-gray-200">
            {/* 탭 헤더 */}
            <div className="sticky top-20 z-30 bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center md:gap-8 lg:gap-16 overflow-x-auto scrollbar-hide">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex-shrink-0 px-6 py-4 text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "text-black"
                                        : "text-gray-400 hover:text-gray-700"
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 탭 콘텐츠 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="container mx-auto px-4 py-12"
                >
                    {/* ① 상품 상세 */}
                    {activeTab === "detail" && (
                        <div className="max-w-3xl mx-auto">
                            {product.detail_images && product.detail_images.length > 0 ? (
                                <div className="space-y-2">
                                    {product.detail_images.map((img, idx) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`상품 상세 ${idx + 1}`}
                                            className="w-full"
                                            draggable={false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400">
                                    <p>상세 이미지가 없습니다.</p>
                                    <p className="text-sm mt-2">관리자 페이지에서 상세 이미지를 등록해주세요.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ② 리뷰 */}
                    {activeTab === "review" && (
                        <ReviewTabContent productId={product.id} />
                    )}

                    {/* ③ 사이즈 가이드 */}
                    {activeTab === "size-guide" && (
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold tracking-widest mb-8 text-center">사이즈 가이드</h3>

                            {/* 발 길이 측정법 */}
                            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                                <h4 className="font-bold text-sm tracking-widest mb-4">📏 발 길이 측정 방법</h4>
                                <ol className="space-y-2 text-sm text-gray-600">
                                    <li>1. 오후 시간대에 측정합니다 (발이 가장 부을 때)</li>
                                    <li>2. 종이 위에 서서 발의 가장 긴 부분을 자로 잽니다</li>
                                    <li>3. 측정값에 5~10mm를 더해 신발 사이즈를 선택합니다</li>
                                    <li>4. 발 볼이 넓은 경우 한 치수 크게 선택 권장</li>
                                </ol>
                            </div>

                            {/* 사이즈 변환표 */}
                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-black text-white">
                                            <th className="py-3 px-4 text-center font-bold tracking-wider">mm</th>
                                            <th className="py-3 px-4 text-center font-bold tracking-wider">UK</th>
                                            <th className="py-3 px-4 text-center font-bold tracking-wider">EU</th>
                                            <th className="py-3 px-4 text-center font-bold tracking-wider">US 여성</th>
                                            <th className="py-3 px-4 text-center font-bold tracking-wider">US 남성</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SHOE_SIZES_TABLE.map((row, idx) => (
                                            <tr
                                                key={row.mm}
                                                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                            >
                                                <td className="py-2.5 px-4 text-center font-bold">{row.mm}</td>
                                                <td className="py-2.5 px-4 text-center text-gray-600">{row.uk}</td>
                                                <td className="py-2.5 px-4 text-center text-gray-600">{row.eu}</td>
                                                <td className="py-2.5 px-4 text-center text-gray-600">{row.us_women}</td>
                                                <td className="py-2.5 px-4 text-center text-gray-600">{row.us_men}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p className="mt-4 text-xs text-gray-400 text-center">
                                * 브랜드별로 사이즈가 다를 수 있습니다. 구매 전 상세 설명을 확인해주세요.
                            </p>
                        </div>
                    )}

                    {/* ③ 배송·교환·반품 */}
                    {activeTab === "delivery" && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {[
                                {
                                    title: "📦 배송 안내",
                                    items: [
                                        "결제 완료 후 1~3 영업일 내 출고 (주말·공휴일 제외)",
                                        "배송비: 3,000원 / 5만원 이상 구매 시 무료 배송",
                                        "제주 및 도서산간 지역은 추가 배송비 발생",
                                        "주문 폭주 시 배송이 지연될 수 있습니다",
                                    ],
                                },
                                {
                                    title: "🔄 교환 안내",
                                    items: [
                                        "수령 후 7일 이내 교환 가능",
                                        "상품 미착용·미세탁 상태에서 원 포장 유지 시 교환 가능",
                                        "교환 배송비: 왕복 6,000원 (단순 변심)",
                                        "불량·오배송의 경우 무료 교환",
                                        "사이즈 교환 시 재고 확인 후 처리",
                                    ],
                                },
                                {
                                    title: "↩️ 반품·환불 안내",
                                    items: [
                                        "수령 후 7일 이내 반품 가능",
                                        "고객 단순 변심: 왕복 배송비 6,000원 차감 후 환불",
                                        "착용·세탁·손상된 상품은 반품 불가",
                                        "환불은 반품 확인 후 2~5 영업일 내 처리",
                                        "주문 취소는 출고 전까지만 가능",
                                    ],
                                },
                                {
                                    title: "⚠️ 반품 불가 사유",
                                    items: [
                                        "착용 흔적이 있는 경우",
                                        "포장 박스·구성품 훼손 시",
                                        "수령 후 7일 초과",
                                        "세일·특가 상품 단순 변심",
                                    ],
                                },
                            ].map((section) => (
                                <div key={section.title} className="bg-gray-50 rounded-2xl p-6">
                                    <h4 className="font-bold text-base mb-4">{section.title}</h4>
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="text-sm text-gray-600 flex gap-2">
                                                <span className="text-gray-400 flex-shrink-0">·</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ⑤ Q&A */}
                    {activeTab === "qna" && (
                        <div className="max-w-3xl mx-auto">
                            <ProductQnA productId={product.id} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// 리뷰 탭 전용 컴포넌트
function ReviewTabContent({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("reviews")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false })
            .then(({ data }) => {
                setReviews(data || []);
                setLoading(false);
            });
    }, [productId]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    return (
        <div className="max-w-3xl mx-auto">
            {/* 평점 요약 */}
            {reviews.length > 0 && (
                <div className="flex items-center gap-6 mb-10 p-6 bg-gray-50 rounded-2xl">
                    <div className="text-center">
                        <div className="text-5xl font-black">{avgRating}</div>
                        <div className="flex justify-center gap-0.5 mt-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                    key={s}
                                    className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{reviews.length}개 리뷰</p>
                    </div>
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-3 text-sm">
                                    <span className="w-4 text-right text-gray-500">{star}</span>
                                    <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37] flex-shrink-0" />
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-[#D4AF37] rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-xs text-gray-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 리뷰 목록 */}
            {reviews.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">아직 작성된 리뷰가 없습니다.</p>
                    <p className="text-sm mt-1">구매 후 리뷰를 남겨주세요!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col items-center text-center">
                                {review.image_url && (
                                    <div className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-sm border border-gray-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={review.image_url}
                                            alt="리뷰 이미지"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-2 justify-center">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${s <= review.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 ml-1">
                                            {review.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-4">
                                        {new Date(review.created_at).toLocaleDateString("ko-KR")}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mb-3">
                                        {review.author_name} <span className="font-normal text-gray-400 ml-1">고객님</span>
                                    </p>
                                    <p className="text-[15px] text-gray-700 leading-relaxed max-w-2xl">
                                        {review.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
