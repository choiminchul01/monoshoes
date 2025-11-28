"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Save, Trash2, Image as ImageIcon, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBanner();
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

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">설정</h1>

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
                                value="0원 (무료)"
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed font-medium"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        * 현재 정책상 모든 고객에게 배송비가 무료로 제공됩니다. 결제 페이지 및 영수증에 '배송비: 무료'로 표기됩니다.
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
