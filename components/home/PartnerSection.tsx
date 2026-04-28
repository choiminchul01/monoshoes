"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PARTNERS = [
    {
        name: "에니스 컴퍼니",
        engName: "ENIS COMPANY",
        description: "데이터 기반의 전략적 마케팅 솔루션을 제공하는 디지털 광고 전문 기업",
        logo: "/images/partners/enis.png"
    },
    {
        name: "주식회사 하이솔루션",
        engName: "HI-SOLUTION",
        description: "최신 기술력을 바탕으로 기업의 성장을 돕는 IT & 광고 테크 솔루션 파트너",
        logo: "/images/partners/hi_solution.png"
    },
    {
        name: "주식회사 굿가드솔루션",
        engName: "GOOD GUARD SOLUTION",
        description: "안전하고 신뢰할 수 있는 브랜드 보안 및 광고 가드 서비스를 제공하는 전문 그룹",
        logo: "/images/partners/good_guard.png"
    }
];

export default function PartnerSection() {
    return (
        <section className="py-32 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* 헤더 부분 */}
                <div className="mb-20 text-center">
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3"
                    >
                        Our Partners
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="inline-block"
                    >
                        <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            PARTNERS
                        </h2>
                    </motion.div>
                    {/* 밑줄 제거됨 */}
                </div>

                {/* 제휴사 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-7xl mx-auto">
                    {PARTNERS.map((partner, index) => (
                        <motion.div
                            key={partner.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="group relative bg-gray-50 border border-gray-100 p-10 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:bg-white"
                        >
                            {/* 로고 영역 (개별 이미지 사용) */}
                            <div className="relative w-full h-40 mb-8 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                                <div className="relative w-40 h-40">
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>

                            {/* 텍스트 영역 */}
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-gray-400 tracking-[0.2em] mb-2">{partner.engName}</p>
                                <h3 className="text-lg font-black text-gray-900 mb-4">{partner.name}</h3>
                                <div className="w-8 h-[1px] bg-gray-300 mx-auto mb-4 group-hover:w-16 group-hover:bg-black transition-all duration-500" />
                                <p className="text-sm text-gray-500 leading-relaxed font-light break-keep">
                                    {partner.description}
                                </p>
                            </div>

                            {/* 배경 장식 */}
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-[40px] font-black pointer-events-none group-hover:opacity-10 transition-opacity">
                                0{index + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
