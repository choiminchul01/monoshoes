"use client";

import { useState } from "react";
import { Monitor, Smartphone, Apple, Share, MoreVertical, PlusSquare, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function GuidePage() {
    const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'pc'>('ios');

    return (
        <div className="min-h-screen bg-white">
            {/* Header Section */}
            <div className="bg-gray-50 py-16 md:py-24 border-b border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold font-serif mb-6 text-gray-900 tracking-tight">
                        App Installation Guide
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        에센시아를 앱으로 설치하여 더 빠르고 편리하게 이용하세요.<br />
                        사용하시는 기기에 맞는 설치 방법을 안내해 드립니다.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-[60px] md:top-[80px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center gap-2 md:gap-8 py-4">
                        <button
                            onClick={() => setActiveTab('ios')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'ios'
                                ? 'bg-black text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <Apple className="w-5 h-5" />
                            <span>iPhone (iOS)</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('android')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'android'
                                ? 'bg-[#00704A] text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <Smartphone className="w-5 h-5" />
                            <span>Android</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pc')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-bold transition-all ${activeTab === 'pc'
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <Monitor className="w-5 h-5" />
                            <span>PC Chrome</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12 mb-20">
                {activeTab === 'ios' && <IOSGuide />}
                {activeTab === 'android' && <AndroidGuide />}
                {activeTab === 'pc' && <PCGuide />}
            </div>

            {/* Bottom CTA */}
            <div className="bg-gray-50 py-16 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">지금 바로 시작해보세요</h2>
                    <p className="text-gray-500 mb-8">설치가 완료되면 홈 화면에서 에센시아 아이콘을 찾아 실행해주세요.</p>
                    <Link href="/home" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors">
                        메인으로 돌아가기
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// iOS Guide Component with Simulated Screenshots
function IOSGuide() {
    return (
        <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full text-xl font-bold mb-2">1</div>
                    <h3 className="text-2xl font-bold text-gray-900">공유 버튼 찾기</h3>
                    <p className="text-gray-500 leading-relaxed">
                        Safari 브라우저 하단 중앙에 있는<br />
                        <span className="font-bold text-blue-600">공유 아이콘(네모 위 화살표)</span>을 눌러주세요.
                    </p>
                </div>
                <div className="flex-1 w-full max-w-[300px] bg-gray-100 rounded-[3rem] p-4 border-4 border-gray-200 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] h-[400px] relative overflow-hidden flex flex-col justify-end border border-gray-200">
                        {/* Fake Content */}
                        <div className="absolute top-10 left-4 right-4 space-y-2 opacity-20">
                            <div className="h-32 bg-gray-200 rounded-xl"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        {/* Simulated Safari Bar */}
                        <div className="bg-[#F8F8F8] border-t border-gray-300 p-4 pb-8 flex justify-between items-center px-6 relative z-10">
                            <div className="w-5 h-5 text-gray-400">&lt;</div>
                            <div className="w-5 h-5 text-gray-400">&gt;</div>
                            {/* Highlighted Share Button */}
                            <div className="relative">
                                <div className="absolute -inset-3 bg-blue-500/20 rounded-full animate-ping"></div>
                                <Share className="w-6 h-6 text-blue-600 relative z-10" />
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs py-1 px-3 rounded-full whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-t-blue-600 after:border-transparent">
                                    Click!
                                </div>
                            </div>
                            <div className="w-5 h-5 text-gray-400">📖</div>
                            <div className="w-5 h-5 text-gray-400">❐</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                <div className="flex-1 text-center md:text-right space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full text-xl font-bold mb-2">2</div>
                    <h3 className="text-2xl font-bold text-gray-900">홈 화면에 추가 선택</h3>
                    <p className="text-gray-500 leading-relaxed">
                        공유 메뉴를 아래로 스크롤하여<br />
                        <span className="font-bold text-gray-900">'홈 화면에 추가'</span> 항목을 찾아 선택하세요.
                    </p>
                </div>
                <div className="flex-1 w-full max-w-[300px] bg-gray-100 rounded-[3rem] p-4 border-4 border-gray-200 shadow-2xl">
                    <div className="bg-gray-800/90 rounded-[2.5rem] h-[400px] relative overflow-hidden flex flex-col justify-end">
                        {/* Simulated Share Sheet */}
                        <div className="bg-[#F2F2F7] rounded-t-2xl h-[320px] p-4 flex flex-col gap-2 overflow-hidden shadow-inner">
                            <div className="bg-white rounded-xl p-3 flex gap-3 mb-2">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div>
                                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="w-20 h-3 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl overflow-hidden p-2 space-y-1">
                                <div className="p-3 border-b flex items-center gap-3 text-gray-400">
                                    <span>복사하기</span>
                                </div>
                                {/* Highlighted Item */}
                                <div className="p-3 bg-gray-100 flex items-center gap-3 relative">
                                    <PlusSquare className="w-5 h-5 text-gray-900" />
                                    <span className="font-bold text-gray-900">홈 화면에 추가</span>
                                    <div className="absolute right-4 w-4 h-4 border-2 border-blue-500 rounded-full"></div>
                                </div>
                                <div className="p-3 flex items-center gap-3 text-gray-400">
                                    <span>즐겨찾기 추가</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full text-xl font-bold mb-2">3</div>
                    <h3 className="text-2xl font-bold text-gray-900">추가 버튼 클릭</h3>
                    <p className="text-gray-500 leading-relaxed">
                        우측 상단의 <span className="font-bold text-blue-600">'추가'</span> 버튼을 누르면<br />
                        앱 아이콘이 홈 화면에 생성됩니다.
                    </p>
                </div>
                <div className="flex-1 w-full max-w-[300px] bg-gray-100 rounded-[3rem] p-4 border-4 border-gray-200 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] h-[400px] relative overflow-hidden">
                        <div className="bg-[#F2F2F7] border-b p-4 flex justify-between items-center pt-8">
                            <span className="text-blue-600">취소</span>
                            <span className="font-bold">홈 화면에 추가</span>
                            <span className="text-blue-600 font-bold border rounded px-2 py-0.5 border-blue-600 bg-blue-50">추가</span>
                        </div>
                        <div className="p-6 flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#00704A] rounded-xl flex items-center justify-center text-white">E</div>
                            <div className="flex-1 border-b pb-2 text-gray-900 font-semibold">에센시아</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Android Guide Component
function AndroidGuide() {
    return (
        <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00704A] text-white rounded-full text-xl font-bold mb-2">1</div>
                    <h3 className="text-2xl font-bold text-gray-900">메뉴 버튼 찾기</h3>
                    <p className="text-gray-500 leading-relaxed">
                        Chrome 브라우저 우측 상단의<br />
                        <span className="font-bold text-gray-900">더보기 메뉴 (점 3개)</span>를 눌러주세요.
                    </p>
                </div>
                <div className="flex-1 w-full max-w-[300px] bg-gray-800 rounded-[3rem] p-3 border-4 border-gray-700 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] h-[400px] relative overflow-hidden border border-gray-200">
                        {/* Simulated Chrome Header */}
                        <div className="bg-white border-b border-gray-200 p-4 pt-8 flex justify-between items-center px-4 relative z-10 shadow-sm">
                            <div className="w-24 h-6 bg-gray-100 rounded-full text-xs flex items-center px-2 text-gray-400">essentia...</div>
                            <div className="flex gap-4 items-center">
                                <div className="w-5 h-5 border-2 border-gray-400 rounded-md text-[10px] flex items-center justify-center font-bold text-gray-500">1</div>
                                <div className="relative">
                                    <div className="absolute -inset-3 bg-[#00704A]/20 rounded-full animate-ping"></div>
                                    <MoreVertical className="w-6 h-6 text-gray-700" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 opacity-10 space-y-4">
                            <div className="h-40 bg-gray-200 rounded-xl"></div>
                            <div className="h-4 bg-gray-200 w-2/3 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                <div className="flex-1 text-center md:text-right space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00704A] text-white rounded-full text-xl font-bold mb-2">2</div>
                    <h3 className="text-2xl font-bold text-gray-900">앱 설치 선택</h3>
                    <p className="text-gray-500 leading-relaxed">
                        메뉴 목록에서 <span className="font-bold text-gray-900">'앱 설치'</span> 또는<br />
                        <span className="font-bold text-gray-900">'홈 화면에 추가'</span>를 선택하세요.
                    </p>
                </div>
                <div className="flex-1 w-full max-w-[300px] bg-gray-800 rounded-[3rem] p-3 border-4 border-gray-700 shadow-2xl">
                    <div className="bg-white rounded-[2.5rem] h-[400px] relative overflow-hidden border border-gray-200">
                        {/* Simulated Menu Dropdown */}
                        <div className="absolute top-2 right-2 w-48 bg-white shadow-xl rounded-lg border border-gray-100 z-20 py-2">
                            <div className="px-4 py-2 hover:bg-gray-50 flex gap-3 text-gray-400">
                                <span>새 탭</span>
                            </div>
                            <div className="px-4 py-2 hover:bg-gray-50 flex gap-3 text-gray-400">
                                <span>북마크</span>
                            </div>
                            {/* Highlighted Item */}
                            <div className="px-4 py-2 bg-[#00704A]/10 flex gap-3 items-center text-gray-900 font-bold border-l-4 border-[#00704A]">
                                <Download className="w-4 h-4 text-[#00704A]" />
                                <span>앱 설치</span>
                            </div>
                            <div className="px-4 py-2 hover:bg-gray-50 flex gap-3 text-gray-400">
                                <span>설정</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// PC Guide Component
function PCGuide() {
    return (
        <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center gap-8 bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-200">
                <div className="text-center space-y-4 max-w-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold mb-2">1</div>
                    <h3 className="text-2xl font-bold text-gray-900">주소창 아이콘 클릭</h3>
                    <p className="text-gray-500 leading-relaxed">
                        화면 상단 주소창("www.essentia..." 등이 적힌 곳)의<br />
                        오른쪽에 있는 <span className="font-bold text-blue-600">설치 아이콘(모니터 또는 + 버튼)</span>을 클릭하세요.
                    </p>
                </div>

                {/* Simulated Address Bar */}
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex items-center gap-4 relative overflow-visible">
                    <div className="flex gap-2 ml-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 flex justify-between items-center">
                        <span>https://essentia.store</span>
                        <div className="flex gap-2 items-center relative">
                            {/* Highlighted Install Icon */}
                            <div className="absolute -inset-3 bg-blue-500/20 rounded-full animate-ping"></div>
                            <div className="p-1 hover:bg-gray-200 rounded cursor-pointer relative z-10">
                                <Monitor className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                        </div>
                    </div>
                    <div className="absolute top-full right-10 mt-4 text-blue-600 font-bold animate-bounce hidden md:block">
                        👆 여기를 클릭!
                    </div>
                </div>
            </div>
        </div>
    );
}  
