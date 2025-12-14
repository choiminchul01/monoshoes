"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreenBanner() {
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
        } else if (isIOS) {
            // iOS Safari - 수동 안내
            alert('📱 홈 화면에 추가하기\n\n1. 화면 하단의 공유 버튼(□↑)을 누르세요\n2. "홈 화면에 추가"를 선택하세요\n3. 추가 버튼을 누르세요');
        } else {
            // PC 또는 Android에서 PWA 조건 미충족 시
            const isAndroid = /Android/.test(navigator.userAgent);
            if (isAndroid) {
                alert('📱 홈 화면에 추가하기\n\n1. 브라우저 메뉴(⋮)를 누르세요\n2. "홈 화면에 추가" 또는 "앱 설치"를 선택하세요');
            } else {
                // PC 브라우저
                alert('💻 바로가기 추가하기\n\n브라우저 주소창 오른쪽의 설치 아이콘(⊕)을 클릭하거나,\n메뉴에서 "앱 설치" 또는 "바로가기 만들기"를 선택하세요.\n\n✅ Chrome: 주소창 오른쪽 설치 아이콘\n✅ Edge: 주소창 오른쪽 앱 아이콘\n✅ Safari: 파일 > 바로가기 추가');
            }
        }
    };

    if (!isVisible || isStandalone) return null;

    return (
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
    );
}
