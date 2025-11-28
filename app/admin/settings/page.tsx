"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Save, Image as ImageIcon, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function AdminSettingsPage() {
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

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
        fetchBanner();
        fetchSiteSettings();
    }, []);

    const fetchBanner = async () => {
        // Fetch the list of files in the 'banners' bucket
        const { data, error } = await supabase.storage
            .from('banners')
            .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

        if (data && data.length > 0) {
            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(data[0].name);
            setBannerUrl(publicUrl);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            // 1. Delete existing files to keep it clean (optional, but good for single banner)
            const { data: existingFiles } = await supabase.storage.from('banners').list();
            if (existingFiles && existingFiles.length > 0) {
                await supabase.storage.from('banners').remove(existingFiles.map(f => f.name));
            }

            // 2. Upload new file
            const fileExt = file.name.split('.').pop();
            const fileName = `main_banner_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(fileName);

            setBannerUrl(publicUrl);
            alert("메인 배너가 업데이트되었습니다.");
        } catch (error) {
            console.error("Banner upload failed:", error);
            alert("배너 업로드 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">설정</h1>

            {/* 쇼핑몰 정보 관리 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-black rounded-full"></span>
                    쇼핑몰 정보 관리
                </h2>
                <div className="space-y-6">
                    {/* Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
                            <input
                                type="text"
                                value={siteSettings.company_name}
                                onChange={(e) => handleSettingsChange('company_name', e.target.value)}
                                placeholder="회사명"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">대표자명</label>
                            <input
                                type="text"
                                value={siteSettings.owner_name}
                                onChange={(e) => handleSettingsChange('owner_name', e.target.value)}
                                placeholder="대표자명"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">사업자등록번호</label>
                            <input
                                type="text"
                                value={siteSettings.business_license}
                                onChange={(e) => handleSettingsChange('business_license', e.target.value)}
                                placeholder="000-00-00000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">통신판매업신고번호</label>
                            <input
                                type="text"
                                value={siteSettings.mail_order_license}
                                onChange={(e) => handleSettingsChange('mail_order_license', e.target.value)}
                                placeholder="제0000-서울-00000호"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">회사 주소</label>
                        <input
                            type="text"
                            value={siteSettings.address}
                            onChange={(e) => handleSettingsChange('address', e.target.value)}
                            placeholder="서울특별시..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">고객센터 전화</label>
                            <input
                                type="text"
                                value={siteSettings.cs_phone}
                                onChange={(e) => handleSettingsChange('cs_phone', e.target.value)}
                                placeholder="010-0000-0000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">운영시간</label>
                            <input
                                type="text"
                                value={siteSettings.cs_hours}
                                onChange={(e) => handleSettingsChange('cs_hours', e.target.value)}
                                placeholder="평일 10:00-18:00"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">대표 이메일</label>
                            <input
                                type="email"
                                value={siteSettings.cs_email}
                                onChange={(e) => handleSettingsChange('cs_email', e.target.value)}
                                placeholder="info@example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    {/* SNS Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                            <input
                                type="url"
                                value={siteSettings.instagram_url}
                                onChange={(e) => handleSettingsChange('instagram_url', e.target.value)}
                                placeholder="https://instagram.com/..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                            <input
                                type="url"
                                value={siteSettings.facebook_url}
                                onChange={(e) => handleSettingsChange('facebook_url', e.target.value)}
                                placeholder="https://facebook.com/..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kakao URL</label>
                            <input
                                type="url"
                                value={siteSettings.kakao_url}
                                onChange={(e) => handleSettingsChange('kakao_url', e.target.value)}
                                placeholder="http://pf.kakao.com/..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {savingSettings ? '저장 중...' : '설정 저장'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 배송비 설정 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-black rounded-full"></span>
                    배송비 설정
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">기본 배송비 정책</h3>
                            <p className="text-sm text-gray-500 mt-1">모든 상품 구매 시 적용되는 기본 배송비입니다.</p>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            무료배송 적용 중
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">기본 배송비</label>
                            <input
                                type="text"
                                value="0원 (무료)"
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">제주/도서산간 추가 배송비</label>
                            <input
                                type="text"
                                value="5,000원"
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed font-medium"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        * 현재 정책상 기본 배송비는 무료입니다. 단, 제주 및 도서산간 지역은 5,000원의 추가 배송비가 발생합니다.
                    </p>
                </div>
            </div>

            {/* 메인 배너 설정 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-black rounded-full"></span>
                    메인 배너 관리
                </h2>
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            쇼핑몰 메인 페이지 최상단에 노출되는 배너 이미지를 설정합니다.<br />
                            권장 사이즈: 1920 x 600 px (최대 5MB)
                        </p>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                            {bannerUrl ? (
                                <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden mb-4">
                                    <Image
                                        src={bannerUrl}
                                        alt="Main Banner"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <ImageIcon className="w-16 h-16 mb-4" />
                                    <p>등록된 배너가 없습니다.</p>
                                </div>
                            )}

                            <label className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                                <Upload className="w-5 h-5" />
                                {uploading ? "업로드 중..." : "배너 이미지 변경"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
