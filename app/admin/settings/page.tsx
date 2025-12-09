"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadBannerAction, deleteBannerAction, fetchBannersAction, uploadPolicyImageAction, deletePolicyImageAction, fetchPolicyImagesAction, saveBannerLinksAction, uploadPartnershipImageAction, deletePartnershipImageAction, fetchPartnershipImageAction } from "./actions";
import { Upload, Save, Image as ImageIcon, CheckCircle, ChevronDown, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

export default function AdminSettingsPage() {
    const toast = useToast();
    // Accordion state - track which section is open
    const [openSection, setOpenSection] = useState<'info' | 'shipping' | 'banner' | 'policy' | 'partnership' | null>(null);

    const [bannerSlots, setBannerSlots] = useState<Array<{ url: string | null; link: string }>>([
        { url: null, link: '' },
        { url: null, link: '' },
        { url: null, link: '' }
    ]);
    const [uploading, setUploading] = useState<number | null>(null); // Track which slot is uploading

    // Policy Images state (이용 안내 이미지)
    const [policyImages, setPolicyImages] = useState<string[]>([]);
    const [policyUploading, setPolicyUploading] = useState<number | null>(null);

    // Partnership Image State
    const [partnershipImage, setPartnershipImage] = useState<string | null>(null);
    const [partnershipUploading, setPartnershipUploading] = useState(false);

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
        shipping_cost: 0,
        extra_shipping_cost: 0,
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchBanners();
        fetchSiteSettings();
        fetchPolicyImages();
        fetchBanners();
        fetchSiteSettings();
        fetchPolicyImages();
        fetchPartnershipImage();
    }, []);

    const fetchPartnershipImage = async () => {
        try {
            const result = await fetchPartnershipImageAction();
            if (result.success) {
                setPartnershipImage(result.imageUrl);
            }
        } catch (error) {
            console.error("Failed to fetch partnership image:", error);
        }
    };

    const handlePartnershipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 10MB를 초과할 수 없습니다.");
            e.target.value = '';
            return;
        }
        setPartnershipUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadPartnershipImageAction(formData);

            if (!result.success) throw new Error(result.error);

            toast.success("제휴 제안서 이미지가 업로드되었습니다.");
            await fetchPartnershipImage();
        } catch (error: any) {
            console.error("Partnership image upload failed:", error);
            toast.error(`업로드 실패: ${error.message}`);
        } finally {
            setPartnershipUploading(false);
            e.target.value = '';
        }
    };

    const handlePartnershipDelete = async () => {
        if (!confirm("제휴 제안서 이미지를 삭제하시겠습니까?")) return;

        try {
            const result = await deletePartnershipImageAction();

            if (!result.success) throw new Error(result.error);

            toast.success("제휴 제안서 이미지가 삭제되었습니다.");
            await fetchPartnershipImage();
        } catch (error) {
            console.error("Partnership image delete failed:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const fetchBanners = async () => {
        try {
            const result = await fetchBannersAction();

            if (result.success && result.banners) {
                const newSlots = [...bannerSlots];
                // Reset slots first
                newSlots.forEach(slot => {
                    slot.url = null;
                    slot.link = '';
                });

                // Update slots with fetched URLs and links
                Object.entries(result.banners).forEach(([key, url]) => {
                    const index = parseInt(key) - 1;
                    if (index >= 0 && index < 3) {
                        newSlots[index] = {
                            url: url as string,
                            link: result.links?.[parseInt(key)] || ''
                        };
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

        // 10MB limit check
        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 10MB를 초과할 수 없습니다.");
            e.target.value = '';
            return;
        }
        setUploading(slotNumber);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('slotNumber', slotNumber.toString());

            const result = await uploadBannerAction(formData);

            if (!result.success) throw new Error(result.error);

            toast.success(`배너 ${slotNumber}번이 업로드되었습니다.`);
            await fetchBanners();
        } catch (error: any) {
            console.error("Banner upload failed:", error);
            toast.error(`배너 업로드 실패: ${error.message}`);
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

            toast.success(`배너 ${slotNumber}번이 삭제되었습니다.`);
            await fetchBanners();
        } catch (error) {
            console.error("Banner delete failed:", error);
            toast.error("배너 삭제 중 오류가 발생했습니다.");
        }
    };

    // Policy Images handlers
    const fetchPolicyImages = async () => {
        try {
            const result = await fetchPolicyImagesAction();
            if (result.success && result.images) {
                setPolicyImages(result.images);
            }
        } catch (error) {
            console.error("Failed to fetch policy images:", error);
        }
    };

    const handlePolicyImageUpload = async (imageIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 10MB를 초과할 수 없습니다.");
            e.target.value = '';
            return;
        }
        setPolicyUploading(imageIndex);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('imageIndex', imageIndex.toString());

            const result = await uploadPolicyImageAction(formData);

            if (!result.success) throw new Error(result.error);

            toast.success(`이용 안내 이미지 ${imageIndex}번이 업로드되었습니다.`);
            await fetchPolicyImages();
        } catch (error: any) {
            console.error("Policy image upload failed:", error);
            toast.error(`업로드 실패: ${error.message}`);
        } finally {
            setPolicyUploading(null);
            e.target.value = '';
        }
    };

    const handlePolicyImageDelete = async (imageIndex: number) => {
        if (!confirm(`이용 안내 이미지 ${imageIndex}번을 삭제하시겠습니까?`)) return;

        try {
            const result = await deletePolicyImageAction(imageIndex);

            if (!result.success) throw new Error(result.error);

            toast.success(`이용 안내 이미지 ${imageIndex}번이 삭제되었습니다.`);
            await fetchPolicyImages();
        } catch (error) {
            console.error("Policy image delete failed:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
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
                    shipping_cost: data.shipping_cost || 0,
                    extra_shipping_cost: data.extra_shipping_cost || 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch site settings:", error);
        }
    };

    const handleSettingsChange = (field: string, value: string | number) => {
        setSiteSettings(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (amount: number) => {
        if (amount === 0) return "무료";
        return `${amount.toLocaleString()}원`;
    };

    const handleSaveSettings = async () => {
        if (!confirm("설정을 저장하시겠습니까?")) return;

        setSavingSettings(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ id: 1, ...siteSettings, updated_at: new Date().toISOString() });

            if (error) throw error;
            toast.success("설정이 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("저장 중 오류가 발생했습니다.");
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 mb-8 overflow-hidden">
                <button
                    onClick={() => setOpenSection(openSection === 'info' ? null : 'info')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            쇼핑몰 정보 관리
                        </h2>
                    </div>
                    <motion.div
                        animate={{ rotate: openSection === 'info' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {openSection === 'info' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-8 pb-8 pt-4 border-t border-gray-100">
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 배송비 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 mb-8 overflow-hidden">
                <button
                    onClick={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            배송비 설정
                        </h2>
                    </div>
                    <motion.div
                        animate={{ rotate: openSection === 'shipping' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {openSection === 'shipping' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-8 pb-8 pt-4 border-t border-gray-100">
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
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={siteSettings.shipping_cost === 0 ? '' : siteSettings.shipping_cost}
                                                    onChange={(e) => handleSettingsChange('shipping_cost', Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors font-normal text-gray-900"
                                                    placeholder="0"
                                                />
                                                <div className="absolute right-0 top-2 text-sm text-green-700 font-bold pointer-events-none">
                                                    {formatCurrency(siteSettings.shipping_cost)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">제주/도서산간 추가 배송비</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={siteSettings.extra_shipping_cost === 0 ? '' : siteSettings.extra_shipping_cost}
                                                    onChange={(e) => handleSettingsChange('extra_shipping_cost', Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full px-0 py-2 border-b border-gray-200 focus:border-green-700 bg-transparent outline-none transition-colors font-normal text-gray-900"
                                                    placeholder="0"
                                                />
                                                <div className="absolute right-0 top-2 text-sm text-green-700 font-bold pointer-events-none">
                                                    {formatCurrency(siteSettings.extra_shipping_cost)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-6 border-t border-gray-50 mt-8">
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 메인 배너 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <button
                    onClick={() => setOpenSection(openSection === 'banner' ? null : 'banner')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            메인 배너 관리
                        </h2>
                    </div>
                    <motion.div
                        animate={{ rotate: openSection === 'banner' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {openSection === 'banner' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-8 pb-8 pt-4 border-t border-gray-100">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-6 font-normal">
                                            쇼핑몰 메인 페이지 최상단에 슬라이드되는 배너 이미지입니다.<br />
                                            최대 3개까지 각 슬롯별로 관리할 수 있습니다.<br />
                                            권장 사이즈: 1920 x 800 px (최대 10MB)
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

                                                    <div className="flex flex-wrap gap-3 items-center">
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

                                                    {/* 링크 입력 필드 */}
                                                    <div className="mt-4">
                                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                                                            <LinkIcon className="w-3 h-3 inline mr-1" />
                                                            배너 클릭 시 이동할 링크
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="url"
                                                                value={bannerSlots[slotNumber - 1]?.link || ''}
                                                                onChange={(e) => {
                                                                    const newSlots = [...bannerSlots];
                                                                    newSlots[slotNumber - 1] = {
                                                                        ...newSlots[slotNumber - 1],
                                                                        link: e.target.value
                                                                    };
                                                                    setBannerSlots(newSlots);
                                                                }}
                                                                placeholder="https://example.com 또는 /shop"
                                                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-700 focus:ring-1 focus:ring-green-700 bg-white outline-none transition-colors font-normal text-gray-900 text-sm"
                                                            />
                                                            <button
                                                                onClick={async () => {
                                                                    const links: { [key: number]: string } = {};
                                                                    links[slotNumber] = bannerSlots[slotNumber - 1]?.link || '';
                                                                    const result = await saveBannerLinksAction(links);
                                                                    if (result.success) {
                                                                        toast.success(`배너 ${slotNumber}번 링크가 저장되었습니다.`);
                                                                    } else {
                                                                        toast.error('링크 저장에 실패했습니다.');
                                                                    }
                                                                }}
                                                                className="px-4 py-2.5 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white transition-all font-bold text-sm whitespace-nowrap"
                                                            >
                                                                <Save className="w-4 h-4 inline mr-1" />
                                                                저장
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1">비워두면 클릭해도 이동하지 않습니다</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 이용 안내 이미지 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mt-8">
                <button
                    onClick={() => setOpenSection(openSection === 'policy' ? null : 'policy')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            이용 안내 이미지 (전 상품 공통)
                        </h2>
                    </div>
                    <motion.div
                        animate={{ rotate: openSection === 'policy' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {openSection === 'policy' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-8 pb-8 pt-4 border-t border-gray-100">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-6 font-normal">
                                            배송 안내, 교환/환불 정책 등 모든 상품 상세 페이지 하단에 공통으로 표시되는 이미지입니다.<br />
                                            여러 장 업로드 시 세로로 이어붙여서 표시됩니다.<br />
                                            권장 사이즈: 900 x 1200 px (최대 10MB)
                                        </p>

                                        {/* 이미지 슬롯 5개 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[1, 2, 3].map((slotNumber) => {
                                                const imageUrl = policyImages[slotNumber - 1];
                                                return (
                                                    <div key={slotNumber} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-bold text-gray-900 text-sm">이미지 {slotNumber}번</h3>
                                                            {imageUrl && (
                                                                <button
                                                                    onClick={() => handlePolicyImageDelete(slotNumber)}
                                                                    className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-700 hover:text-white text-xs font-bold transition-all"
                                                                >
                                                                    삭제
                                                                </button>
                                                            )}
                                                        </div>

                                                        {imageUrl ? (
                                                            <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                                                                <Image
                                                                    src={imageUrl}
                                                                    alt={`Policy ${slotNumber}`}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="relative w-full aspect-[3/4] bg-gray-50 rounded-lg flex items-center justify-center mb-3 border-2 border-dashed border-gray-200">
                                                                <div className="text-center text-gray-400">
                                                                    <ImageIcon className="w-10 h-10 mx-auto mb-2 stroke-1" />
                                                                    <p className="text-xs font-normal">이미지 {slotNumber}번</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white cursor-pointer transition-all font-bold text-xs w-full justify-center">
                                                            <Upload className="w-3 h-3" />
                                                            {policyUploading === slotNumber ? "업로드 중..." : imageUrl ? "변경" : "업로드"}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handlePolicyImageUpload(slotNumber, e)}
                                                                disabled={policyUploading === slotNumber}
                                                            />
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 제휴 제안서 이미지 설정 섹션 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mt-8">
                <button
                    onClick={() => setOpenSection(openSection === 'partnership' ? null : 'partnership')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            제휴 제안서 이미지
                        </h2>
                    </div>
                    <motion.div
                        animate={{ rotate: openSection === 'partnership' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {openSection === 'partnership' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-8 pb-8 pt-4 border-t border-gray-100">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-6 font-normal">
                                            제휴문의 페이지(/partner/inquiry) 상단에 노출되는 제안서 및 안내 이미지입니다.<br />
                                            권장 사이즈: 가로 1200px 이상 (세로 길이는 자유, 최대 10MB)
                                        </p>

                                        <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all max-w-md">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900">현재 등록된 이미지</h3>
                                                {partnershipImage && (
                                                    <button
                                                        onClick={handlePartnershipDelete}
                                                        className="px-4 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-700 hover:text-white text-xs font-bold transition-all"
                                                    >
                                                        삭제
                                                    </button>
                                                )}
                                            </div>

                                            {partnershipImage ? (
                                                <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
                                                    <Image
                                                        src={partnershipImage}
                                                        alt="Partnership Proposal"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative w-full aspect-[3/4] bg-gray-50 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                                                    <div className="text-center text-gray-400">
                                                        <ImageIcon className="w-12 h-12 mx-auto mb-2 stroke-1" />
                                                        <p className="text-sm font-normal">등록된 이미지가 없습니다</p>
                                                    </div>
                                                </div>
                                            )}

                                            <label className="flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white cursor-pointer transition-all font-bold text-sm w-full">
                                                <Upload className="w-4 h-4" />
                                                {partnershipUploading ? "업로드 중..." : partnershipImage ? "이미지 변경" : "이미지 업로드"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePartnershipUpload}
                                                    disabled={partnershipUploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
