"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchBannersAction, type MainBanner as MainBannerType } from "@/app/admin/settings/actions";

const FALLBACK_SLIDES = [
    {
        id: 'fallback-1',
        imageUrl: "/images/banner/main_banner_women_1.png",
        link: "/shop",
        title: "WOMEN COLLECTION",
        subtitle: "모노슈즈가 제안하는 프리미엄 여성 컬렉션",
        order: 0
    },
    {
        id: 'fallback-2',
        imageUrl: "/images/event/event_bg_2.png",
        link: "/shop?filter=new",
        title: "SPRING BREEZE",
        subtitle: "화사한 봄날의 설렘을 담은 아이코닉 룩",
        order: 1
    },
    {
        id: 'fallback-3',
        imageUrl: "/images/event/event_bg_3.png",
        link: "/shop",
        title: "SUMMER SPLASH",
        subtitle: "시원한 여름, 가장 빛나는 당신의 발걸음",
        order: 2
    },
    {
        id: 'fallback-4',
        imageUrl: "/images/event/event_bg_4.png",
        link: "/shop",
        title: "AUTUMN MOOD",
        subtitle: "깊어가는 가을, 클래식한 감성의 완성",
        order: 3
    },
    {
        id: 'fallback-5',
        imageUrl: "/images/event/event_bg_5.png",
        link: "/event",
        title: "WINTER CHIC",
        subtitle: "차가운 계절에도 놓칠 수 없는 우아함",
        order: 4
    },
];

export function MainBanner() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState<any[]>(FALLBACK_SLIDES); // Set local slides as initial state
    const [loading, setLoading] = useState(false); // Set loading to false immediately
    const [direction, setDirection] = useState(1); // 1: next, -1: prev
    const [isDragging, setIsDragging] = useState(false);

    // 배너 클릭 핸들러
    const handleBannerClick = () => {
        if (isDragging) return; // 드래그 중에는 클릭 무시

        const link = slides[currentSlide]?.link;
        if (link && link.trim()) {
            // 외부 링크인지 내부 링크인지 확인
            if (link.startsWith('http://') || link.startsWith('https://')) {
                window.open(link, '_blank');
            } else {
                router.push(link);
            }
        }
    };

    useEffect(() => {
        // Temporarily disabled Supabase fetch to show new local high-quality images
        // You can re-enable this after migrating images to Supabase tomorrow
        /*
        const fetchBanners = async () => {
            try {
                const result = await fetchBannersAction();
                if (result.success && result.banners && result.banners.length > 0) {
                    const mappedSlides = result.banners.map((b: MainBannerType) => ({
                        ...b,
                        title: b.title || "", 
                        subtitle: b.subtitle || ""
                    }));
                    setSlides(mappedSlides);
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
        */
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return; // Don't auto-slide if only 1 slide

        const timer = setInterval(() => {
            setDirection(1);
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 8000); // 8초로 변경
        return () => clearInterval(timer);
    }, [slides, currentSlide]); // currentSlide 변경 시 타이머 리셋

    // 이전 슬라이드로
    const goToPrev = () => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    // 다음 슬라이드로
    const goToNext = () => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    // 스와이프 핸들러
    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = offset.x;
        const swipeVelocity = velocity.x;
        const swipeThreshold = 50;
        const velocityThreshold = 500;

        if (swipe < -swipeThreshold || swipeVelocity < -velocityThreshold) {
            goToNext();
        } else if (swipe > swipeThreshold || swipeVelocity > velocityThreshold) {
            goToPrev();
        }
    };

    if (loading) {
        return (
            <div className="relative w-full h-[60vh] md:h-screen bg-gray-200 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-400">Loading banners...</div>
                </div>
            </div>
        );
    }

    if (slides.length === 0) return null;

    // 슬라이드 애니메이션 변수
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -1000 : 1000,
            opacity: 0,
        }),
    };

    return (
        <div className="relative w-full aspect-[7/5] md:h-screen overflow-hidden bg-gray-100 group">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className={`absolute inset-0 ${slides[currentSlide]?.link?.trim() ? 'cursor-pointer' : 'cursor-grab'} active:cursor-grabbing`}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={(e, info) => {
                        setTimeout(() => setIsDragging(false), 100);
                        handleDragEnd(e, info);
                    }}
                    onClick={handleBannerClick}
                >
                    {/* Background Extension for Wide Screens */}
                    <div className="absolute inset-0 bg-[#b8b8b8] hidden md:block">
                        <Image
                            src={slides[currentSlide].imageUrl}
                            alt=""
                            fill
                            className="object-cover blur-3xl opacity-40 scale-110 pointer-events-none"
                            unoptimized
                        />
                    </div>
                    
                    <Image
                        src={slides[currentSlide].imageUrl}
                        alt={slides[currentSlide].title || "Banner"}
                        fill
                        className="object-cover md:object-contain object-center pointer-events-none relative z-0"
                        priority={currentSlide === 0}
                        quality={100}
                        sizes="100vw"
                        unoptimized
                        draggable={false}
                    />
                    {/* Premium Text Overlay */}
                    {(slides[currentSlide].title || slides[currentSlide].subtitle) && (
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/20 pointer-events-none p-10 md:p-20">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="flex flex-col items-center"
                                >
                                    {slides[currentSlide].title && (
                                        <h2 
                                            className="text-5xl md:text-8xl font-black tracking-[0.1em] mb-6 text-center drop-shadow-2xl uppercase" 
                                            style={{ fontFamily: 'var(--font-cinzel), serif' }}
                                        >
                                            {slides[currentSlide].title}
                                        </h2>
                                    )}
                                    {slides[currentSlide].subtitle && (
                                        <p className="text-lg md:text-2xl font-bold tracking-[0.2em] text-center drop-shadow-xl opacity-90">
                                            {slides[currentSlide].subtitle}
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm z-10">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                setDirection(index > currentSlide ? 1 : -1);
                                setCurrentSlide(index);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? "bg-white w-8" : "bg-white/50"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrev();
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button
                        className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </>
            )}
        </div>
    );
}
