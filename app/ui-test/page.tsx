/**
 * UI/UX 개선 테스트 페이지
 * 
 * 만든 기능들을 테스트해보는 페이지입니다:
 * - 로딩 스피너
 * - Toast 알림
 * - 버튼 로딩 상태
 * - 페이지 로더
 */

'use client';

import { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';

export default function UITestPage() {
    const toast = useToast();
    const [showPageLoader, setShowPageLoader] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);

    // 버튼 로딩 테스트
    const handleButtonTest = () => {
        setButtonLoading(true);
        setTimeout(() => {
            setButtonLoading(false);
            toast.success('작업이 완료되었습니다!');
        }, 2000);
    };

    // 페이지 로더 테스트
    const handlePageLoaderTest = () => {
        setShowPageLoader(true);
        setTimeout(() => {
            setShowPageLoader(false);
        }, 2000);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">UI/UX 개선 기능 테스트</h1>

            {/* 페이지 로더 */}
            {showPageLoader && <PageLoader text="데이터 로딩 중..." />}

            <div className="space-y-12">
                {/* 1. 로딩 스피너 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">1. 로딩 스피너</h2>
                    <div className="flex gap-8 items-center p-6 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Small Spinner</p>
                            <LoadingSpinner size="small" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Medium Spinner (기본)</p>
                            <LoadingSpinner size="medium" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Large Spinner</p>
                            <LoadingSpinner size="large" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Dots Spinner</p>
                            <LoadingSpinner variant="dots" />
                        </div>
                    </div>
                </section>

                {/* 2. Toast 알림 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">2. Toast 알림</h2>
                    <div className="flex gap-4 flex-wrap p-6 bg-gray-50 rounded-lg">
                        <Button onClick={() => toast.success('성공했습니다!')}>
                            ✅ 성공 Toast
                        </Button>
                        <Button
                            onClick={() => toast.error('오류가 발생했습니다!')}
                            variant="destructive"
                        >
                            ❌ 에러 Toast
                        </Button>
                        <Button
                            onClick={() => toast.warning('주의가 필요합니다!')}
                            variant="outline"
                        >
                            ⚠️ 경고 Toast
                        </Button>
                        <Button
                            onClick={() => toast.info('알려드립니다!')}
                            variant="secondary"
                        >
                            ℹ️ 정보 Toast
                        </Button>
                    </div>
                </section>

                {/* 3. 버튼 로딩 상태 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">3. 버튼 로딩 상태</h2>
                    <div className="flex gap-4 p-6 bg-gray-50 rounded-lg">
                        <Button
                            onClick={handleButtonTest}
                            isLoading={buttonLoading}
                            loadingText="처리 중..."
                        >
                            {buttonLoading ? '' : '클릭해보세요!'}
                        </Button>
                        <Button
                            onClick={handleButtonTest}
                            isLoading={buttonLoading}
                            variant="outline"
                        >
                            {buttonLoading ? '' : '다른 버튼'}
                        </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                        버튼을 클릭하면 2초간 로딩 상태가 됩니다. 로딩 중에는 클릭이 안 됩니다!
                    </p>
                </section>

                {/* 4. 페이지 로더 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">4. 전체 화면 로더</h2>
                    <div className="flex gap-4 p-6 bg-gray-50 rounded-lg">
                        <Button onClick={handlePageLoaderTest}>
                            페이지 로더 테스트
                        </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                        버튼을 클릭하면 2초간 화면 전체에 로딩 오버레이가 표시됩니다.
                    </p>
                </section>

                {/* 5. 실제 사용 예시 */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">5. 실제 사용 시나리오</h2>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg space-y-4">
                        <h3 className="text-lg font-bold">💡 이렇게 사용됩니다:</h3>
                        <ul className="space-y-2 text-sm">
                            <li>✅ 장바구니 담기 버튼 → 버튼 로딩 + 성공 Toast</li>
                            <li>✅ 페이지 이동 시 → 페이지 로더</li>
                            <li>✅ 이미지 로딩 중 → 스켈레톤 UI (다음 단계)</li>
                            <li>✅ 주문 완료 → 성공 Toast + 리다이렉트</li>
                            <li>✅ 에러 발생 → 에러 Toast + 안내</li>
                        </ul>
                    </div>
                </section>
            </div>

            {/* 완료 메시지 */}
            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-bold text-green-800 mb-2">
                    🎉 DAY 1 핵심 기능 완성!
                </h3>
                <p className="text-green-700">
                    로딩 스피너, Toast 알림, 버튼 로딩 상태가 모두 작동합니다!
                    이제 실제 페이지에 적용할 준비가 되었습니다.
                </p>
            </div>
        </div>
    );
}
