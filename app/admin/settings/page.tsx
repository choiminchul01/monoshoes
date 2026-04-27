"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    uploadBannerAction, deleteBannerAction, fetchBannersAction,
    saveBannerOrderAction,
    uploadPWAIconAction, deletePWAIconAction, fetchPWAIconsAction,
    uploadBrandLogoAction, deleteBrandLogoAction, saveBrandLogosAction, fetchBrandLogosAction,
    type MainBanner
} from "./actions";
import { Upload, Save, Image as ImageIcon, CheckCircle, ChevronDown, ChevronUp, Link as LinkIcon, Smartphone, Trash2, Plus, GripVertical } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

export default function AdminSettingsPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'shop' | 'design'>('shop');

    // --- State ---
    const [banners, setBanners] = useState<MainBanner[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);



    // 디자인 탭 아코디언 상태 (한 번에 하나만 열림, 기본 모두 닫힘)
    const [designAccordion, setDesignAccordion] = useState<string | null>(null);
    const toggleDesignAccordion = (section: string) => {
        setDesignAccordion(prev => prev === section ? null : section);
    };

    const [pwaIcons, setPwaIcons] = useState<{ [key: string]: string }>({});
    const [pwaUploading, setPwaUploading] = useState<string | null>(null);

    interface BrandLogo {
        name: string;
        imageUrl: string | null;
        order: number;
    }
    const [brandLogos, setBrandLogos] = useState<BrandLogo[]>([]);
    const [brandUploading, setBrandUploading] = useState<string | null>(null);
    const [newBrandName, setNewBrandName] = useState('');

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
        show_owner_name: true,
        show_business_license: true,
        show_mail_order_license: true,
        show_address: true,
        show_cs_phone: true,
        show_cs_hours: true,
        show_cs_email: true,
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // --- Effects ---
    useEffect(() => {
        fetchBanners();
        fetchSiteSettings();

        fetchPwaIcons();
        fetchBrandLogos();
    }, []);

    // --- Handlers ---


    const fetchPwaIcons = async () => {
        try {
            const result = await fetchPWAIconsAction();
            if (result.success && result.icons) {
                setPwaIcons(result.icons);
            }
        } catch (error) {
            console.error("PWA icons fetch failed:", error);
        }
    };

    const handlePwaIconUpload = async (size: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPwaUploading(size);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('size', size);
            const result = await uploadPWAIconAction(formData);
            if (!result.success) throw new Error(result.error);
            toast.success(`${size}x${size} 아이콘이 업로드되었습니다.`);
            await fetchPwaIcons();
        } catch (error: any) {
            console.error("PWA icon upload failed:", error);
            toast.error(error.message || "업로드 중 오류가 발생했습니다.");
        } finally {
            setPwaUploading(null);
        }
    };

    const handlePwaIconDelete = async (size: string) => {
        if (!confirm(`${size}x${size} 아이콘을 삭제하시겠습니까?`)) return;
        try {
            const result = await deletePWAIconAction(size);
            if (!result.success) throw new Error(result.error);
            toast.success("아이콘이 삭제되었습니다.");
            await fetchPwaIcons();
        } catch (error) {
            console.error("PWA icon delete failed:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const fetchBrandLogos = async () => {
        try {
            const result = await fetchBrandLogosAction();
            if (result.success && result.logos) {
                setBrandLogos(result.logos);
            }
        } catch (error) {
            console.error("Brand logos fetch failed:", error);
        }
    };

    const handleAddBrand = async () => {
        if (!newBrandName.trim()) {
            toast.error("브랜드명을 입력해주세요.");
            return;
        }
        if (brandLogos.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
            toast.error("이미 존재하는 브랜드입니다.");
            return;
        }
        const newBrand: BrandLogo = {
            name: newBrandName.trim().toUpperCase(),
            imageUrl: null,
            order: brandLogos.length
        };
        const updatedLogos = [...brandLogos, newBrand];
        setBrandLogos(updatedLogos);
        setNewBrandName('');
        try {
            const result = await saveBrandLogosAction(updatedLogos);
            if (result.success) {
                toast.success("브랜드가 추가되었습니다.");
            }
        } catch (error) {
            console.error("Brand add failed:", error);
        }
    };

    const handleBrandLogoUpload = async (brandName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBrandUploading(brandName);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('brandName', brandName);
            formData.append('order', brandLogos.find(b => b.name === brandName)?.order.toString() || '0');
            const result = await uploadBrandLogoAction(formData);
            if (!result.success) throw new Error(result.error);
            toast.success(`${brandName} 로고가 업로드되었습니다.`);
            await fetchBrandLogos();
        } catch (error: any) {
            console.error("Brand logo upload failed:", error);
            toast.error(error.message || "업로드 중 오류가 발생했습니다.");
        } finally {
            setBrandUploading(null);
        }
    };

    const handleBrandDelete = async (brandName: string) => {
        if (!confirm(`${brandName} 브랜드를 삭제하시겠습니까?`)) return;
        try {
            const result = await deleteBrandLogoAction(brandName);
            if (!result.success) throw new Error(result.error);
            toast.success("브랜드가 삭제되었습니다.");
            await fetchBrandLogos();
        } catch (error) {
            console.error("Brand delete failed:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    const fetchBanners = async () => {
        try {
            const result = await fetchBannersAction();
            if (result.success && result.banners) {
                setBanners(result.banners);
            }
        } catch (error) {
            console.error("Failed to fetch banners:", error);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 10MB를 초과할 수 없습니다.");
            e.target.value = '';
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadBannerAction(formData);
            if (!result.success) throw new Error(result.error);
            toast.success(`배너가 추가되었습니다.`);
            await fetchBanners();
        } catch (error: any) {
            console.error("Banner upload failed:", error);
            toast.error(`배너 업로드 실패: ${error.message}`);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleBannerDelete = async (bannerId: string) => {
        if (!confirm(`배너를 삭제하시겠습니까?`)) return;
        try {
            const result = await deleteBannerAction(bannerId);
            if (!result.success) throw new Error(result.error);
            toast.success(`배너가 삭제되었습니다.`);
            await fetchBanners();
        } catch (error) {
            console.error("Banner delete failed:", error);
            toast.error("배너 삭제 중 오류가 발생했습니다.");
        }
    };

    const handleBannerLinkChange = (id: string, link: string) => {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, link } : b));
    };

    const handleSaveBannerOrder = async () => {
        setSavingSettings(true);
        try {
            const result = await saveBannerOrderAction(banners);
            if (!result.success) throw new Error(result.error);
            toast.success("배너 설정이 저장되었습니다.");
        } catch (error: any) {
            console.error(error);
            toast.error("저장 중 오류가 발생했습니다.");
        } finally {
            setSavingSettings(false);
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
                    show_owner_name: data.show_owner_name ?? true,
                    show_business_license: data.show_business_license ?? true,
                    show_mail_order_license: data.show_mail_order_license ?? true,
                    show_address: data.show_address ?? true,
                    show_cs_phone: data.show_cs_phone ?? true,
                    show_cs_hours: data.show_cs_hours ?? true,
                    show_cs_email: data.show_cs_email ?? true,
                });
            }
        } catch (error) {
            console.error("Failed to fetch site settings:", error);
        }
    };

    const handleSettingsChange = (field: string, value: string | number | boolean) => {
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Title Row */}
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">설정</h1>
                <p className="text-gray-500">쇼핑몰의 기본 정보와 디자인, 운영 정책을 관리하세요.</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`px-8 py-4 text-base font-bold transition-all relative ${activeTab === 'shop'
                        ? 'text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    쇼핑몰 설정
                    {activeTab === 'shop' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-green-700 rounded-t-full"
                        />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('design')}
                    className={`px-8 py-4 text-base font-bold transition-all relative ${activeTab === 'design'
                        ? 'text-green-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    디자인 관리
                    {activeTab === 'design' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-1 bg-green-700 rounded-t-full"
                        />
                    )}
                </button>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'shop' && (
                    <motion.div
                        key="shop"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* 쇼핑몰 정보 관리 */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
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

                                {/* Footer Visibility Toggles */}
                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">푸터 정보 표시 설정</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { key: 'show_owner_name', label: '대표자명' },
                                            { key: 'show_business_license', label: '사업자등록번호' },
                                            { key: 'show_mail_order_license', label: '통신판매업신고' },
                                            { key: 'show_address', label: '회사 주소' },
                                            { key: 'show_cs_phone', label: '고객센터 전화' },
                                            { key: 'show_cs_hours', label: '운영시간' },
                                            { key: 'show_cs_email', label: '이메일' },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={siteSettings[key as keyof typeof siteSettings] as boolean}
                                                        onChange={(e) => handleSettingsChange(key, e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                                                </div>
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

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

                        {/* 배송비 설정 */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-900">배송비 설정</h2>
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
                {activeTab === 'design' && (
                    <motion.div
                        key="design"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* 메인 배너 설정 */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleDesignAccordion('banner')}
                                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900">메인 배너 관리</h2>
                                    <span className="text-sm text-gray-400 ml-2">{banners.length}개</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${designAccordion === 'banner' ? 'rotate-180' : ''}`} />
                            </button>
                            {designAccordion === 'banner' && (
                                <div className="p-8 border-t border-gray-100">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-500">
                                                메인 화면 상단에 표시될 배너를 관리합니다. (권장 사이즈: 1920x800px)
                                            </p>
                                            <label className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm font-bold shadow-sm">
                                                <Plus className="w-4 h-4" />
                                                배너 추가
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleBannerUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>

                                        <div className="space-y-4">
                                            {banners.map((banner, index) => (
                                                <div key={banner.id} className="flex gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100 items-start group">
                                                    <div className="flex flex-col items-center gap-2 pt-2">
                                                        <div className="p-2 bg-white rounded-md shadow-sm cursor-move text-gray-400 group-hover:text-green-700 transition-colors">
                                                            <span className="text-xs font-bold">{index + 1}</span>
                                                        </div>
                                                    </div>

                                                    <div className="relative w-48 aspect-[2.4/1] bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                                                        <Image
                                                            src={banner.imageUrl}
                                                            alt={`Banner ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex-1 space-y-2">
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">링크 URL</label>
                                                        <div className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    value={banner.link}
                                                                    onChange={(e) => handleBannerLinkChange(banner.id, e.target.value)}
                                                                    placeholder="/shop 또는 외부 링크"
                                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm transition-all"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleBannerDelete(banner.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="삭제"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {banners.length === 0 && (
                                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    등록된 배너가 없습니다.
                                                </div>
                                            )}
                                        </div>

                                        {banners.length > 0 && (
                                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                                <button
                                                    onClick={handleSaveBannerOrder}
                                                    className="flex items-center gap-2 px-6 py-2 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white hover:border-green-700 transition-all duration-300 font-bold text-sm shadow-sm"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    변경사항 저장 (순서/링크)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 브랜드 로고 관리 */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleDesignAccordion('brand')}
                                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-gray-900">브랜드 로고 관리</h2>
                                    <span className="text-sm text-gray-400 ml-2">{brandLogos.length}개</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${designAccordion === 'brand' ? 'rotate-180' : ''}`} />
                            </button>
                            {designAccordion === 'brand' && (
                                <div className="p-8 border-t border-gray-100">
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-semibold mb-1">홈페이지 브랜드 슬라이더</p>
                                                <p className="text-blue-700">홈페이지에 표시되는 명품 브랜드 로고입니다.</p>
                                                <ul className="mt-2 space-y-1 text-blue-600">
                                                    <li>• 권장 크기: <strong>200x200px</strong> (정사각형)</li>
                                                    <li>• 투명 배경 PNG 권장</li>
                                                    <li>• 원형으로 표시됩니다</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 새 브랜드 추가 */}
                                    <div className="mb-6 flex gap-3">
                                        <input
                                            type="text"
                                            value={newBrandName}
                                            onChange={(e) => setNewBrandName(e.target.value)}
                                            placeholder="새 브랜드명 입력 (예: GUCCI)"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                                        />
                                        <button
                                            onClick={handleAddBrand}
                                            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                                        >
                                            <Plus className="w-4 h-4" />
                                            브랜드 추가
                                        </button>
                                    </div>

                                    {/* 브랜드 목록 */}
                                    <div className="space-y-3">
                                        {brandLogos.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                등록된 브랜드가 없습니다. 위에서 브랜드를 추가해주세요.
                                            </div>
                                        ) : (
                                            brandLogos.map((brand, index) => (
                                                <div
                                                    key={brand.name}
                                                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                                                >
                                                    {/* 순서 표시 */}
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <GripVertical className="w-4 h-4" />
                                                        <span className="text-sm font-mono">{index + 1}</span>
                                                    </div>

                                                    {/* 로고 이미지 */}
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {brand.imageUrl ? (
                                                            <Image
                                                                src={brand.imageUrl}
                                                                alt={brand.name}
                                                                width={64}
                                                                height={64}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-gray-400 text-center px-1">
                                                                {brand.name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* 브랜드명 */}
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{brand.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {brand.imageUrl ? '✅ 로고 등록됨' : '⚠️ 로고 미등록'}
                                                        </p>
                                                    </div>

                                                    {/* 액션 버튼 */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors text-sm font-medium flex items-center gap-1">
                                                            <Upload className="w-3 h-3" />
                                                            {brandUploading === brand.name ? '업로드 중...' : '로고 업로드'}
                                                            <input
                                                                type="file"
                                                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                                className="hidden"
                                                                onChange={(e) => handleBrandLogoUpload(brand.name, e)}
                                                                disabled={brandUploading !== null}
                                                            />
                                                        </label>
                                                        <button
                                                            onClick={() => handleBrandDelete(brand.name)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="브랜드 삭제"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* 앱 아이콘 관리 */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleDesignAccordion('pwa')}
                                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                                    <h2 className="text-xl font-bold text-gray-900">앱 아이콘 관리</h2>
                                    <span className="text-sm text-gray-400 ml-2">{Object.keys(pwaIcons).length}개</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${designAccordion === 'pwa' ? 'rotate-180' : ''}`} />
                            </button>
                            {designAccordion === 'pwa' && (
                                <div className="p-8 border-t border-gray-100">
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-semibold mb-1">홈 화면 바로가기 아이콘</p>
                                                <p className="text-blue-700">사용자가 홈 화면에 추가할 때 표시되는 앱 아이콘입니다.</p>
                                                <ul className="mt-2 space-y-1 text-blue-600">
                                                    <li>• <strong>512x512px</strong> - 고해상도 기기용 (필수)</li>
                                                    <li>• <strong>192x192px</strong> - 일반 기기용 (필수)</li>
                                                    <li>• PNG 형식 권장, 정사각형 이미지</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* 512x512 아이콘 */}
                                        <div className="border border-gray-200 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">필수</span>
                                                512 x 512 px
                                            </h4>
                                            {pwaIcons['512'] ? (
                                                <div className="relative mb-3">
                                                    <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                        <Image
                                                            src={pwaIcons['512']}
                                                            alt="PWA Icon 512"
                                                            width={128}
                                                            height={128}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handlePwaIconDelete('512')}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-3">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white cursor-pointer transition-all font-semibold text-sm">
                                                <Upload className="w-4 h-4" />
                                                {pwaUploading === '512' ? '업로드 중...' : '이미지 업로드'}
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                    onChange={(e) => handlePwaIconUpload('512', e)}
                                                    disabled={pwaUploading !== null}
                                                />
                                            </label>
                                        </div>

                                        {/* 192x192 아이콘 */}
                                        <div className="border border-gray-200 rounded-xl p-4">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">필수</span>
                                                192 x 192 px
                                            </h4>
                                            {pwaIcons['192'] ? (
                                                <div className="relative mb-3">
                                                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                        <Image
                                                            src={pwaIcons['192']}
                                                            alt="PWA Icon 192"
                                                            width={96}
                                                            height={96}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handlePwaIconDelete('192')}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 mx-auto rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-3">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-900 border border-green-300 rounded-lg hover:bg-green-700 hover:text-white cursor-pointer transition-all font-semibold text-sm">
                                                <Upload className="w-4 h-4" />
                                                {pwaUploading === '192' ? '업로드 중...' : '이미지 업로드'}
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                    onChange={(e) => handlePwaIconUpload('192', e)}
                                                    disabled={pwaUploading !== null}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

