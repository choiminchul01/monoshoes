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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

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
                    .limit(15);

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
                
                // Shuffle array and assign persistent float ratings (4.5 ~ 5.0) for variety
                const processed = combined.map(review => {
                    // Generate a stable pseudo-random float between 4.5 and 5.0 based on the first character of ID
                    const charCode = review.id.charCodeAt(0) || 0;
                    const pseudoRandom = (charCode % 6) / 10; // 0.0 to 0.5
                    const floatRating = Math.min(5.0, 4.5 + pseudoRandom);
                    return { ...review, displayRating: floatRating };
                });
                
                for (let i = processed.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [processed[i], processed[j]] = [processed[j], processed[i]];
                }

                setReviews(processed as (Review & { displayRating: number })[]);
                setCurrentIndex(processed.length); // Start at middle block
                
                // Enable transitions shortly after first render to prevent initial load slide
                setTimeout(() => setIsTransitioning(true), 100);
            } catch (error) {
                console.error("Error in fetchReviews:", error);
            }
        };

        fetchReviews();
    }, []);

    // Auto-slide logic
    useEffect(() => {
        if (reviews.length === 0 || isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev === reviews.length * 2) {
                    return prev; // Wait for snap
                }
                setIsTransitioning(true);
                return prev + 1;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [reviews.length, isHovered]);

    // Handle seamless infinite loop resetting
    useEffect(() => {
        // If we reach the end of the second block, snap back to the start of the second block
        if (currentIndex === reviews.length * 2 && reviews.length > 0) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(reviews.length);
            }, 1000); // Wait for CSS transition
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, reviews.length]);

    if (reviews.length === 0) return null;

    // 3배열 생성: 왼쪽 예비, 가운데 실제, 오른쪽 예비 (무한 루프용)
    const displayReviews = [...reviews, ...reviews, ...reviews];

    return (
        <div className="w-full bg-gray-50/50 py-12 my-8 border-t border-b border-gray-100 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                .review-slider-wrapper { 
                    --slide-width: 85vw; 
                    --slide-gap: 16px;
                    /* 양쪽 끝 페이드 아웃 마스크 */
                    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                }
                @media (min-width: 768px) { 
                    .review-slider-wrapper { 
                        --slide-width: 320px; 
                        mask-image: linear-gradient(to right, transparent, black 25%, black 75%, transparent);
                        -webkit-mask-image: linear-gradient(to right, transparent, black 25%, black 75%, transparent);
                    } 
                }
            `}} />
            
            <div className="container mx-auto px-4 mb-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.05em' }}>
                    REAL REVIEWS
                </h3>
                <p className="text-sm text-gray-500 mt-2">고객님들이 증명하는 모노슈즈의 가치</p>
            </div>

            <div 
                className="relative w-full overflow-hidden review-slider-wrapper py-4"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div 
                    className="flex w-max"
                    style={{
                        // 50vw - (slideWidth / 2) 로 현재 활성화된 슬라이드를 중앙에 배치
                        transform: `translateX(calc(50vw - (var(--slide-width) / 2) - ${currentIndex} * (var(--slide-width) + var(--slide-gap))))`,
                        transition: isTransitioning ? 'transform 1s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                    }}
                >
                    {displayReviews.map((review, idx) => (
                        <div 
                            key={`${review.id}-${idx}`}
                            className="flex-shrink-0 bg-white border border-gray-200 rounded-xl mr-4 flex flex-col overflow-hidden shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                            style={{ width: 'var(--slide-width)' }}
                        >
                            {/* 정사각형 리뷰 이미지 란 */}
                            <div className="w-full aspect-square bg-gray-50 relative border-b border-gray-100">
                                {review.image_url ? (
                                    <Image src={review.image_url} alt="Review" fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                        <span className="text-xs tracking-widest font-medium uppercase">No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 flex flex-col flex-grow justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="relative inline-flex">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={`bg-${i}`} className="w-4 h-4 text-gray-200 fill-gray-200 flex-shrink-0" />
                                                ))}
                                            </div>
                                            <div 
                                                className="absolute top-0 left-0 flex gap-0.5 overflow-hidden" 
                                                style={{ width: `${((review as any).displayRating / 5) * 100}%` }}
                                            >
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={`fg-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">
                                            {((review as any).displayRating).toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-400 mb-2 truncate">
                                        {review.product?.name || "모노슈즈 베스트 아이템"}
                                    </p>
                                    <p className="text-[14px] text-gray-800 leading-relaxed font-medium line-clamp-3">
                                        {review.content}
                                    </p>
                                </div>
                                
                                <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                                    <span className="text-sm font-bold text-gray-900">
                                        {review.author_name?.length > 2 
                                            ? review.author_name.substring(0, 1) + '*' + review.author_name.substring(2) 
                                            : review.author_name?.length === 2 
                                            ? review.author_name.substring(0, 1) + '*'
                                            : review.author_name} 
                                        <span className="text-xs font-normal text-gray-500 ml-1">고객님</span>
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
