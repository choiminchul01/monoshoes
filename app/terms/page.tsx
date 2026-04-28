"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SiteSettings {
    company_name: string;
}

export default function TermsOfUsePage() {
    const [settings, setSettings] = useState<SiteSettings>({
        company_name: '모노슈즈'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('company_name')
                .eq('id', 1)
                .single();
            if (data) {
                setSettings({
                    company_name: data.company_name || '모노슈즈'
                });
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFCF5]">
            {/* Header */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-[#D4AF37] mb-3 tracking-widest uppercase"
                    >
                        Service Terms
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold tracking-wider"
                        style={{ fontFamily: "'S-Core Dream', sans-serif" }}
                    >
                        이용약관
                    </motion.h1>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 text-gray-700 text-sm leading-relaxed space-y-10"
                >
                    {/* 제1조 목적 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제1조 (목적)
                        </h2>
                        <div className="pl-4">
                            이 약관은 {settings.company_name}(이하 "회사"라 함)가 운영하는 {settings.company_name} 사이버 몰(이하 "몰"이라 함)에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 함)를 이용함에 있어 사이버 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                        </div>
                    </section>

                    {/* 제2조 정의 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제2조 (정의)
                        </h2>
                        <div className="pl-4 space-y-3">
                            <p>① "몰"이란 "회사"가 재화 또는 용역(이하 "재화 등"이라 함)을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 사이버몰을 운영하는 사업자의 의미로도 사용합니다.</p>
                            <p>② "이용자"란 "몰"에 접속하여 이 약관에 따라 "몰"이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
                            <p>③ '회원'이라 함은 "몰"에 회원등록을 한 자로서, 계속적으로 "몰"이 제공하는 서비스를 이용할 수 있는 자를 말합니다.</p>
                            <p>④ '비회원'이라 함은 회원에 가입하지 않고 "몰"이 제공하는 서비스를 이용하는 자를 말합니다.</p>
                        </div>
                    </section>

                    {/* 제3조 약관 등의 명시와 설명 및 개정 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제3조 (약관 등의 명시와 설명 및 개정)
                        </h2>
                        <div className="pl-4 space-y-3">
                            <p>① "몰"은 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소, 전화번호·모사전송번호·전자우편주소, 사업자등록번호, 통신판매업 신고번호 등을 이용자가 쉽게 알 수 있도록 사이버몰의 초기 서비스화면(전면)에 게시합니다.</p>
                            <p>② "몰"은 이용자가 약관에 동의하기에 앞서 약관에 정해져 있는 내용 중 청약철회·배송책임·환불조건 등과 같은 중요한 내용을 이용자가 이해할 수 있도록 별도의 연결화면 또는 팝업화면 등을 제공하여 이용자의 확인을 구하여야 합니다.</p>
                        </div>
                    </section>

                    {/* 제4조 서비스의 제공 및 변경 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제4조 (서비스의 제공 및 변경)
                        </h2>
                        <div className="pl-4 space-y-3">
                            <p>① "몰"은 다음과 같은 업무를 수행합니다.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
                                <li>구매계약이 체결된 재화 또는 용역의 배송</li>
                                <li>기타 "몰"이 정하는 업무</li>
                            </ul>
                        </div>
                    </section>

                    {/* 제5조 회원가입 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제5조 (회원가입)
                        </h2>
                        <div className="pl-4 space-y-3 text-gray-600">
                            <p>① 이용자는 "몰"이 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
                            <p>② "몰"은 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                                <li>기타 회원으로 등록하는 것이 "몰"의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                            </ul>
                        </div>
                    </section>

                    {/* 제6조 구매신청 및 개인정보 제공 동의 등 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제6조 (구매신청 및 개인정보 제공 동의 등)
                        </h2>
                        <div className="pl-4 space-y-3">
                            <p>① "몰"의 이용자는 "몰"상에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, "몰"은 이용자가 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                <li>재화 등의 검색 및 선택</li>
                                <li>받는 사람의 성명, 주소, 전화번호, 전자우편주소 등의 입력</li>
                                <li>약관내용, 청약철회권이 제한되는 서비스, 배송료 등의 비용부담과 관련한 내용에 대한 확인</li>
                                <li>결제방법의 선택</li>
                            </ul>
                        </div>
                    </section>

                    {/* 환불 규정 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            제15조 (환불 및 청약철회)
                        </h2>
                        <div className="pl-4 space-y-3">
                            <p>① "몰"과 재화 등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날부터 7일 이내에는 청약의 철회를 할 수 있습니다.</p>
                            <p>② 이용자는 재화 등을 배송 받은 경우 다음 각 호의 1에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                <li>이용자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우</li>
                                <li>이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우</li>
                                <li>시간의 경과에 의하여 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
                            </ul>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="pt-8 border-t border-gray-100 text-center text-[10px] text-gray-400">
                        본 이용약관은 2025년 4월 28일부터 적용됩니다.
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
