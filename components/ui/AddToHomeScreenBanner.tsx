"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Smartphone } from 'lucide-react';
import Link from 'next/link';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreenBanner() {
    const [showInstructions, setShowInstructions] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'pc'>('pc');
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 이미 홈 화면에서 실행 중인지 확인 (PWA 모드)
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        setIsStandalone(isInStandaloneMode);

        // 이미 앱으로 실행 중이면 표시하지 않음
        if (isInStandaloneMode) return;

        // iOS 확인
        const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // 사용자가 이미 닫았는지 확인 (1일 후 다시 표시)
        const dismissed = localStorage.getItem('a2hs_dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneDay = 24 * 60 * 60 * 1000; // 1일 후 다시 표시

        if (dismissed && Date.now() - dismissedTime < oneDay) {
            return;
        }

        // Android/Chrome의 beforeinstallprompt 이벤트 처리
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            showBanner();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // PC/모바일 모두 3초 후 배너 표시 (beforeinstallprompt 이벤트가 없어도)
        const timer = setTimeout(() => {
            showBanner();
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const showBanner = () => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 50);
    };

    const hideBanner = () => {
        setIsAnimating(false);
        setTimeout(() => setIsVisible(false), 300);
        localStorage.setItem('a2hs_dismissed', Date.now().toString());
    };

    const handleAddToHomeScreen = async () => {
        if (deferredPrompt) {
            // Android/Chrome - PWA 설치 프롬프트 표시
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted A2HS');
            }
            setDeferredPrompt(null);
            hideBanner();
        } else {
            // 수동 설치 안내 모달 표시
            if (isIOS) {
                setPlatform('ios');
            } else if (/Android/.test(navigator.userAgent)) {
                setPlatform('android');
            } else {
                setPlatform('pc');
            }
            setShowInstructions(true);
        }
    };

    if (!isVisible || isStandalone) return null;

    return (
        <>
            {/* 하단 배너 */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${isAnimating ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-4 md:py-3 safe-area-pb relative">
                    {/* 닫기 버튼 - 우측 상단 구석 */}
                    <button
                        onClick={hideBanner}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="닫기"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="max-w-2xl mx-auto">
                        {/* 모바일 레이아웃: 세로 배치, 두 줄 텍스트 */}
                        <div className="md:hidden flex flex-col items-center gap-3 pr-6">
                            <div className="flex items-center gap-3 w-full">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#00704A] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-sm">
                                    <Smartphone className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-800 text-sm font-semibold leading-snug">
                                        에센시아를 홈 화면에 추가하고,
                                    </p>
                                    <p className="text-gray-800 text-sm font-semibold leading-snug">
                                        하이엔드 퀄리티 제품을 쉽고 빠르게 만나보세요!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleAddToHomeScreen}
                                className="w-full bg-gradient-to-r from-[#00704A] to-[#4CAF50] hover:from-[#005a3c] hover:to-[#43A047] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>홈 화면에 추가</span>
                            </button>
                        </div>

                        {/* PC 레이아웃: 가로 배치, 한 줄 텍스트, 큰 폰트 */}
                        <div className="hidden md:flex items-center justify-between gap-4 pr-8">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00704A] to-[#4CAF50] rounded-xl flex items-center justify-center shadow-sm">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-gray-800 text-base font-semibold whitespace-nowrap">
                                    에센시아를 홈 화면에 추가하고, 하이엔드 퀄리티 제품을 쉽고 빠르게 만나보세요!
                                </p>
                            </div>
                            <button
                                onClick={handleAddToHomeScreen}
                                className="bg-gradient-to-r from-[#00704A] to-[#4CAF50] hover:from-[#005a3c] hover:to-[#43A047] text-white text-base font-bold px-6 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" />
                                <span>홈 화면에 추가</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 수동 설치 안내 모달 */}
            {showInstructions && (
                <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowInstructions(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-black"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smartphone className="w-6 h-6 text-[#00704A]" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">홈 화면에 추가하기</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {platform === 'ios' && '아이폰(Safari) 사용자 가이드'}
                                {platform === 'android' && '안드로이드 사용자 가이드'}
                                {platform === 'pc' && 'PC 사용자 가이드'}
                            </p>
                            <Link href="/guide" className="text-xs text-gray-400 underline mt-2 hover:text-black inline-block">
                                자세한 설치 가이드 보기 &gt;
                            </Link>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-3 mb-6 text-left">
                            {platform === 'ios' && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">1</span>
                                        <span>화면 하단의 <strong>공유 버튼</strong> <span className="inline-block border border-gray-300 rounded px-1 text-[10px] mx-1">□↑</span> 을 눌러주세요.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">2</span>
                                        <span>메뉴 목록에서 <strong>'홈 화면에 추가'</strong>를 찾아 선택해주세요.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">3</span>
                                        <span>우측 상단의 <strong>'추가'</strong> 버튼을 누르면 완료됩니다.</span>
                                    </div>
                                </>
                            )}
                            {platform === 'android' && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">1</span>
                                        <span>브라우저 우측 상단의 <strong>메뉴 버튼</strong> <span className="inline-block border border-gray-300 rounded px-1 text-[10px] mx-1">⋮</span> 을 눌러주세요.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">2</span>
                                        <span><strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong> 메뉴를 선택해주세요.</span>
                                    </div>
                                </>
                            )}
                            {platform === 'pc' && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">1</span>
                                        <span>브라우저 <strong>주소창 오른쪽</strong>을 확인해주세요.</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-[#00704A]">2</span>
                                        <span><strong>설치 아이콘(모니터/+)</strong>을 클릭하여 설치할 수 있습니다.</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setShowInstructions(false)}
                            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            확인했습니다
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
