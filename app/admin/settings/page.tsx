"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadBannerAction, deleteBannerAction, fetchBannersAction } from "./actions";
import { Upload, Save, Image as ImageIcon, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function AdminSettingsPage() {
    // Banner slots state - array of 3 slots
    const [bannerSlots, setBannerSlots] = useState<Array<{ url: string | null }>>([{ url: null }, { url: null }, { url: null }]);
    const [uploading, setUploading] = useState<number | null>(null); // Track which slot is uploading

    // Site Settings State
    const [siteSettings, setSiteSettings] = useState({
        company_name: '',
        owner_name: '',
        business_license: '',
        mail_order_license: '',
        address: '',
        cs_phone: '',
        cs_hours: '',
        cs_email: '',
        instagram_url: '',
        facebook_url: '',
        kakao_url: '',
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchBanners();
        fetchSiteSettings();
    }, []);

    const fetchBanners = async () => {
        try {
            const result = await fetchBannersAction();

            if (result.success && result.banners) {
                const newSlots = [...bannerSlots];
                // Reset slots first
                newSlots.forEach(slot => slot.url = null);

                // Update slots with fetched URLs
                Object.entries(result.banners).forEach(([key, url]) => {
                    const index = parseInt(key) - 1;
                    if (index >= 0 && index < 3) {
                        newSlots[index] = { url: url as string };
                    }
                });

                setBannerSlots(newSlots);
            }
        } catch (error) {
            console.error("Failed to fetch banners:", error);
        }
    };

    const handleBannerUpload = async (slotNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(slotNumber);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('slotNumber', slotNumber.toString());

            const result = await uploadBannerAction(formData);

            if (!result.success) throw new Error(result.error);

            alert(`배너 ${slotNumber}번이 업로드되었습니다.`);
            await fetchBanners();
        } catch (error: any) {
            console.error("Banner upload failed:", error);
            alert(`배너 업로드 실패: ${error.message}`);
        } finally {
            setUploading(null);
            // Reset input value to allow re-uploading same file if needed
            e.target.value = '';
        }
    };

    const handleBannerDelete = async (slotNumber: number) => {
        if (!confirm(`배너 ${slotNumber}번을 삭제하시겠습니까?`)) return;

        try {
            const result = await deleteBannerAction(slotNumber);

            if (!result.success) throw new Error(result.error);

            alert(`배너 ${slotNumber}번이 삭제되었습니다.`);
            await fetchBanners();
        } catch (error) {
            console.error("Banner delete failed:", error);
            alert("배너 삭제 중 오류가 발생했습니다.");
        }
    };

    const fetchSiteSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;
            if (data) {
                setSiteSettings({
                    company_name: data.company_name || '',
                    owner_name: data.owner_name || '',
                    business_license: data.business_license || '',
                    mail_order_license: data.mail_order_license || '',
                    address: data.address || '',
                    cs_phone: data.cs_phone || '',
                    cs_hours: data.cs_hours || '',
                    cs_email: data.cs_email || '',
                    instagram_url: data.instagram_url || '',
                    facebook_url: data.facebook_url || '',
                    kakao_url: data.kakao_url || '',
                });
            }
        } catch (error) {
            console.error("Failed to fetch site settings:", error);
        }
    };

    const handleSettingsChange = (field: string, value: string) => {
        setSiteSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ id: 1, ...siteSettings, updated_at: new Date().toISOString() });

            if (error) throw error;
            alert("쇼핑몰 정보가 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setSavingSettings(false);
        }
    };

    return (
        <div>
            {/* Title Row */}
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold">설정</h1>
            </div>

            {/* 쇼핑몰 정보 관리 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-8 mb-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                        쇼핑몰 정보 관리
                    </h2>
                </div>

                <div className="space-y-8">
                    {/* Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">회사명</label>
                            <input
                                type="text"
                                value={siteSettings.company_name}
                                onChange={(e) => handleSettingsChange('company_name', e.target.value)}
                                placeholder="회사명을 입력하세요"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">대표자명</label>
                            <input
                                type="text"
                                value={siteSettings.owner_name}
                                onChange={(e) => handleSettingsChange('owner_name', e.target.value)}
                                placeholder="대표자명을 입력하세요"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">사업자등록번호</label>
                            <input
                                type="text"
                                value={siteSettings.business_license}
                                onChange={(e) => handleSettingsChange('business_license', e.target.value)}
                                placeholder="000-00-00000"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">통신판매업신고번호</label>
                            <input
                                type="text"
                                value={siteSettings.mail_order_license}
                                onChange={(e) => handleSettingsChange('mail_order_license', e.target.value)}
                                placeholder="제0000-서울-00000호"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="group">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">회사 주소</label>
                        <input
                            type="text"
                            value={siteSettings.address}
                            onChange={(e) => handleSettingsChange('address', e.target.value)}
                            placeholder="주소를 입력하세요"
                            className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                        />
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">고객센터 전화</label>
                            <input
                                type="text"
                                value={siteSettings.cs_phone}
                                onChange={(e) => handleSettingsChange('cs_phone', e.target.value)}
                                placeholder="010-0000-0000"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">운영시간</label>
                            <input
                                type="text"
                                value={siteSettings.cs_hours}
                                onChange={(e) => handleSettingsChange('cs_hours', e.target.value)}
                                placeholder="평일 10:00-18:00"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">대표 이메일</label>
                            <input
                                type="email"
                                value={siteSettings.cs_email}
                                onChange={(e) => handleSettingsChange('cs_email', e.target.value)}
                                placeholder="info@example.com"
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                    </div>

                    {/* SNS Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">Instagram URL</label>
                            <input
                                type="url"
                                value={siteSettings.instagram_url}
                                onChange={(e) => handleSettingsChange('instagram_url', e.target.value)}
                                placeholder="https://instagram.com/..."
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">Facebook URL</label>
                            <input
                                type="url"
                                value={siteSettings.facebook_url}
                                onChange={(e) => handleSettingsChange('facebook_url', e.target.value)}
                                placeholder="https://facebook.com/..."
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-green-700 transition-colors">Kakao URL</label>
                            <input
                                type="url"
                                value={siteSettings.kakao_url}
                                onChange={(e) => handleSettingsChange('kakao_url', e.target.value)}
                                placeholder="http://pf.kakao.com/..."
                                className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors placeholder-gray-300 font-normal text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-50">
                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="flex items-center gap-2 px-8 py-3 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white hover:border-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide shadow-sm hover:shadow-md group"
                        >
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {savingSettings ? '저장 중...' : '설정 저장'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 배송비 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-8 mb-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                        배송비 설정
                    </h2>
                </div>

                <div className="bg-gray-50/50 p-8 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">기본 배송비 정책</h3>
                            <p className="text-sm text-gray-500 mt-1 font-normal">모든 상품 구매 시 적용되는 기본 배송비입니다.</p>
                        </div>
                        <span className="px-4 py-1.5 bg-white text-green-700 border border-green-200 text-xs font-bold rounded-full flex items-center gap-2 shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                            적용 중
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">기본 배송비</label>
                            <input
                                type="text"
                                value="0원 (무료)"
                                disabled
                                className="w-full px-0 py-2 border-b border-gray-200 bg-transparent text-gray-500 cursor-not-allowed font-normal"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">제주/도서산간 추가 배송비</label>
                            <input
                                type="text"
                                value="5,000원"
                                disabled
                                className="w-full px-0 py-2 border-b border-gray-200 bg-transparent text-gray-500 cursor-not-allowed font-normal"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-6 font-normal italic">
                        * 현재 정책상 기본 배송비는 무료입니다. 단, 제주 및 도서산간 지역은 5,000원의 추가 배송비가 발생합니다.
                    </p>
                </div>
            </div>

            {/* 메인 배너 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                        메인 배너 관리
                    </h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-6 font-normal">
                            쇼핑몰 메인 페이지 최상단에 슬라이드되는 배너 이미지입니다.<br />
                            최대 3개까지 각 슬롯별로 관리할 수 있습니다.<br />
                            권장 사이즈: 1920 x 600 px (최대 5MB)
                        </p>

                        {/* 배너 슬롯 3개 */}
                        <div className="grid grid-cols-1 gap-6">
                            {[1, 2, 3].map((slotNumber) => (
                                <div key={slotNumber} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900">배너 {slotNumber}번</h3>
                                        {bannerSlots[slotNumber - 1]?.url && (
                                            <button
                                                onClick={() => handleBannerDelete(slotNumber)}
                                                className="px-4 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-700 hover:text-white text-xs font-bold transition-all"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>

                                    {bannerSlots[slotNumber - 1]?.url ? (
                                        <div className="relative w-full aspect-[2.4/1] bg-gray-100 rounded-lg overflow-hidden mb-4">
                                            <Image
                                                src={bannerSlots[slotNumber - 1].url!}
                                                alt={`Banner ${slotNumber}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative w-full aspect-[2.4/1] bg-gray-50 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                                            <div className="text-center text-gray-400">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-2 stroke-1" />
                                                <p className="text-sm font-normal">배너 {slotNumber}번 슬롯</p>
                                            </div>
                                        </div>
                                    )}

                                    <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white cursor-pointer transition-all font-bold text-sm">
                                        <Upload className="w-4 h-4" />
                                        {uploading === slotNumber ? "업로드 중..." : bannerSlots[slotNumber - 1]?.url ? "이미지 변경" : "이미지 업로드"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleBannerUpload(slotNumber, e)}
                                            disabled={uploading === slotNumber}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
