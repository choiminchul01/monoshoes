"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";
import Image from "next/image";

type Review = {
    id: string;
    author_name: string;
    rating: number;
    content: string;
    image_url: string | null;
    product: {
        category: string;
        name: string;
    };
};

export default function ReviewSlider() {
    const [reviews, setReviews] = useState<Review[]>([]);

    // Fetch Reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Fetch Female (여성) Reviews
                const { data: femaleData, error: femaleError } = await supabase
                    .from('reviews')
                    .select('id, author_name, rating, content, image_url, product:products!inner(category, name)')
                    .like('products.category', 'W_%')
                    .gte('rating', 4)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Fetch Male (남성) Reviews
                const { data: maleData, error: maleError } = await supabase
                    .from('reviews')
                    .select('id, author_name, rating, content, image_url, product:products!inner(category, name)')
                    .like('products.category', 'M_%')
                    .gte('rating', 4)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (femaleError) console.error("Error fetching female reviews:", femaleError);
                if (maleError) console.error("Error fetching male reviews:", maleError);

                let combined = [...(femaleData || []), ...(maleData || [])];
                
                // Shuffle array and assign persistent float ratings
                const processed = combined.map(review => {
                    const charCode = review.id.charCodeAt(0) || 0;
                    const pseudoRandom = (charCode % 6) / 10;
                    const floatRating = Math.min(5.0, 4.5 + pseudoRandom);
                    return { ...review, displayRating: floatRating };
                });
                
                for (let i = processed.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [processed[i], processed[j]] = [processed[j], processed[i]];
                }

                setReviews(processed as (Review & { displayRating: number })[]);
            } catch (error) {
                console.error("Error in fetchReviews:", error);
            }
        };

        fetchReviews();
    }, []);

    if (reviews.length === 0) return null;

    // 무한 루프를 위해 배열을 복제
    const displayReviews = [...reviews, ...reviews, ...reviews, ...reviews];

    return (
        <div className="w-full bg-gray-50/50 py-12 my-8 border-t border-b border-gray-100 overflow-hidden pointer-events-none select-none">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-1 * (var(--slide-width) + var(--slide-gap)) * ${reviews.length})); }
                }
                .review-slider-wrapper { 
                    --slide-width: 280px; 
                    --slide-gap: 20px;
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
                .review-track {
                    display: flex;
                    width: max-content;
                    animation: scroll 60s linear infinite;
                }
                @media (max-width: 768px) {
                    .review-slider-wrapper { --slide-width: 240px; }
                    .review-track { animation-duration: 40s; }
                }
            `}} />
            
            <div className="container mx-auto px-4 mb-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.05em' }}>
                    REAL REVIEWS
                </h3>
                <p className="text-sm text-gray-500 mt-2">고객님들이 증명하는 모노슈즈의 가치</p>
            </div>

            <div className="relative w-full overflow-hidden review-slider-wrapper py-4">
                <div className="review-track">
                    {displayReviews.map((review, idx) => (
                        <div 
                            key={`${review.id}-${idx}`}
                            className="flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm mr-[var(--slide-gap)]"
                            style={{ width: 'var(--slide-width)' }}
                        >
                            {/* 정사각형 리뷰 이미지 */}
                            <div className="w-full aspect-square bg-gray-50 relative border-b border-gray-100">
                                {review.image_url ? (
                                    <Image 
                                        src={review.image_url} 
                                        alt="Review" 
                                        fill 
                                        sizes="280px"
                                        className="object-cover" 
                                        unoptimized
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <span className="text-xs tracking-widest font-medium uppercase">No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex flex-col flex-grow justify-between">
                                <div className="flex flex-col items-center text-center">
                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                        <div className="relative inline-flex">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={`bg-${i}`} className="w-3.5 h-3.5 text-gray-100 fill-gray-100 flex-shrink-0" />
                                                ))}
                                            </div>
                                            <div 
                                                className="absolute top-0 left-0 flex gap-0.5 overflow-hidden" 
                                                style={{ width: `${((review as any).displayRating / 5) * 100}%` }}
                                            >
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={`fg-${i}`} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">
                                            {((review as any).displayRating).toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400 mb-2 w-full truncate px-2">
                                        {review.product?.name || "모노슈즈 베스트 아이템"}
                                    </p>
                                    <p className="text-[13px] text-gray-800 leading-relaxed font-medium line-clamp-2 w-full px-1">
                                        {review.content}
                                    </p>
                                </div>
                                
                                <div className="mt-4 flex items-center justify-center border-t border-gray-50 pt-3">
                                    <span className="text-[11px] font-bold text-gray-500">
                                        {review.author_name?.length > 2 
                                            ? review.author_name.substring(0, 1) + '*' + review.author_name.substring(2) 
                                            : review.author_name?.length === 2 
                                            ? review.author_name.substring(0, 1) + '*'
                                            : review.author_name} 
                                        <span className="font-normal text-gray-400 ml-1">고객님</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
