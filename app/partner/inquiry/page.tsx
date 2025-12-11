"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Mail, Phone, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PartnerInquiryPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        inquiryType: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [partnershipImages, setPartnershipImages] = useState<string[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            // Fetch both array and legacy column
            const { data } = await supabase
                .from('site_settings')
                .select('partnership_proposal_image, partnership_proposal_images')
                .eq('id', 1)
                .single();

            if (data?.partnership_proposal_images && Array.isArray(data.partnership_proposal_images) && data.partnership_proposal_images.length > 0) {
                setPartnershipImages(data.partnership_proposal_images);
            } else if (data?.partnership_proposal_image) {
                // Fallback to legacy single image if array is empty but legacy exists
                setPartnershipImages([data.partnership_proposal_image]);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Save to database
            const { error } = await supabase
                .from('partner_inquiries')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    inquiry_type: formData.inquiryType,
                    message: formData.message,
                    status: 'pending'
                });

            if (error) throw error;

            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            alert('문의 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-2xl shadow-lg text-center max-w-lg"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">문의가 접수되었습니다</h2>
                    <p className="text-gray-600 mb-8">
                        담당자 배정 후 빠른 시일 내에 연락드리겠습니다.<br />
                        감사합니다.
                    </p>
                    <a
                        href="/home"
                        className="inline-block px-8 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        홈으로 돌아가기
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-10 text-center"
                >
                    <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Partnership</p>
                    <h1 className="text-3xl font-bold tracking-widest" style={{ fontFamily: "'S-Core Dream', sans-serif" }}>제휴문의</h1>
                    <p className="mt-4 text-sm text-gray-500 text-center">
                        우리와 함께 성장하는 파트너<br />
                        누구든, 언제든, 만족하실꺼에요. 에센시아.
                    </p>
                </motion.div>

                {/* Partnership Proposal Images */}
                {partnershipImages.length > 0 && (
                    <div className="mb-12 space-y-8">
                        {partnershipImages.map((src, index) => (
                            <motion.img
                                key={index}
                                src={src}
                                alt={`Partnership Proposal ${index + 1}`}
                                className="w-full h-auto block rounded-2xl shadow-sm border border-gray-100 bg-white"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        ))}
                    </div>
                )}

                {/* Form */}
                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-3xl mx-auto"
                >
                    <div className="space-y-6">
                        {/* Name / Company */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                성함 / 회사명
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="성함 또는 회사명을 입력해주세요"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Email & Phone - Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Mail className="w-4 h-4" />
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Phone className="w-4 h-4" />
                                    연락처
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="010-0000-0000"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Inquiry Type */}
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">
                                제휴 유형
                            </label>
                            <select
                                name="inquiryType"
                                value={formData.inquiryType}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
                            >
                                <option value="">선택해주세요</option>
                                <option value="startup">무점포 창업</option>
                                <option value="wholesale">도매/대량 구매</option>
                                <option value="distribution">유통/입점 제안</option>
                                <option value="collaboration">콜라보레이션</option>
                                <option value="other">기타</option>
                            </select>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                문의 내용
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="문의 내용을 작성해주세요"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-1/2 mx-auto mt-8 py-4 bg-[#3157b7] text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                제출 중...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                문의하기
                            </>
                        )}
                    </motion.button>
                </motion.form>
            </div>
        </div>
    );
}
