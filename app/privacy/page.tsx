"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SiteSettings {
    company_name: string;
    cs_email: string;
}

export default function PrivacyPolicyPage() {
    const [settings, setSettings] = useState<SiteSettings>({
        company_name: '모노슈즈',
        cs_email: 'master@monoshoes.com'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('company_name, cs_email')
                .eq('id', 1)
                .single();
            if (data) {
                setSettings({
                    company_name: data.company_name || '모노슈즈',
                    cs_email: data.cs_email || 'master@monoshoes.com'
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
                        Privacy Policy
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold tracking-wider"
                        style={{ fontFamily: "'S-Core Dream', sans-serif" }}
                    >
                        개인정보 처리방침
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
                    {/* 서문 */}
                    <section>
                        <p className="font-bold text-gray-900 mb-2">
                            {settings.company_name}(이하 "회사"는) 고객님의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법령을 준수하고 있습니다.
                        </p>
                        <p>
                            회사는 개인정보처리방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                        </p>
                    </section>

                    {/* 1. 수집하는 개인정보 항목 및 수집방법 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            1. 수집하는 개인정보 항목 및 수집방법
                        </h2>
                        <div className="space-y-4 pl-4">
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">가. 수집하는 개인정보의 항목</h3>
                                <p className="mb-2">회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                    <li><span className="font-medium">회원가입 시:</span> 이름, 생년월일, 성별, 로그인ID, 비밀번호, 자택 전화번호, 휴대전화번호, 이메일, (14세 미만 가입자의 경우 법정대리인의 정보)</li>
                                    <li><span className="font-medium">서비스 신청 시:</span> 주소, 결제 정보</li>
                                    <li><span className="font-medium">기타:</span> 서비스 이용 과정이나 사업 처리 과정에서 서비스이용기록, 접속로그, 쿠키, 접속 IP, 결제 기록, 불량이용 기록이 생성되어 수집될 수 있습니다.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">나. 수집방법</h3>
                                <p className="text-gray-600">
                                    홈페이지, 서면양식, 게시판, 이메일, 이벤트 응모, 배송요청, 전화, 팩스, 생성 정보 수집 툴을 통한 수집
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 2. 개인정보의 수집 및 이용목적 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            2. 개인정보의 수집 및 이용목적
                        </h2>
                        <div className="space-y-4 pl-4">
                            <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                            <ul className="list-disc pl-5 space-y-4 text-gray-600">
                                <li>
                                    <span className="font-bold text-gray-800">서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산:</span><br/>
                                    콘텐츠 제공, 구매 및 요금 결제, 물품배송 또는 청구지 등 발송, 금융거래 본인 인증 및 금융 서비스
                                </li>
                                <li>
                                    <span className="font-bold text-gray-800">회원 관리:</span><br/>
                                    회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인, 만14세 미만 아동 개인정보 수집 시 법정 대리인 동의여부 확인, 불만처리 등 민원처리, 고지사항 전달
                                </li>
                                <li>
                                    <span className="font-bold text-gray-800">마케팅 및 광고에 활용:</span><br/>
                                    이벤트 등 광고성 정보 전달, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. 개인정보의 보유 및 이용기간 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            3. 개인정보의 보유 및 이용기간
                        </h2>
                        <div className="space-y-4 pl-4">
                            <p>원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
                            
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">가. 회사 내부방침에 의한 정보보유 사유</h3>
                                <p className="text-gray-600">
                                    회원이 탈퇴한 경우에도 불량회원의 부정한 이용의 재발을 방지, 분쟁해결 및 수사기관의 요청에 따른 협조를 위하여, 이용계약 해지일로부터 <span className="font-bold text-gray-900">1년간</span> 회원의 정보를 보유할 수 있습니다.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">나. 관련 법령에 의한 정보 보유 사유</h3>
                                <div className="overflow-x-auto mt-3">
                                    <table className="w-full text-xs text-left border-collapse border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-200 p-3">보유 정보</th>
                                                <th className="border border-gray-200 p-3">보존 기간</th>
                                                <th className="border border-gray-200 p-3">관련 법령</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="border border-gray-200 p-3">계약 또는 청약철회 등에 관한 기록</td>
                                                <td className="border border-gray-200 p-3">5년</td>
                                                <td className="border border-gray-200 p-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-200 p-3">대금 결제 및 재화 등의 공급에 관한 기록</td>
                                                <td className="border border-gray-200 p-3">5년</td>
                                                <td className="border border-gray-200 p-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-200 p-3">소비자 불만 또는 분쟁처리에 관한 기록</td>
                                                <td className="border border-gray-200 p-3">3년</td>
                                                <td className="border border-gray-200 p-3">전자상거래 등에서의 소비자보호에 관한 법률</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-200 p-3">로그 기록</td>
                                                <td className="border border-gray-200 p-3">3개월</td>
                                                <td className="border border-gray-200 p-3">통신비밀보호법</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. 개인정보의 파기절차 및 방법 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            4. 개인정보의 파기절차 및 방법
                        </h2>
                        <div className="space-y-4 pl-4 text-gray-600">
                            <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
                            <p><span className="font-bold text-gray-800">파기절차:</span> 회원님이 회원가입 등을 위해 입력하신 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기되어집니다. 별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 보유되어지는 이외의 다른 목적으로 이용되지 않습니다.</p>
                            <p><span className="font-bold text-gray-800">파기방법:</span> 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</p>
                        </div>
                    </section>

                    {/* 5. 개인정보의 제3자 제공 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            5. 개인정보의 제3자 제공
                        </h2>
                        <div className="space-y-4 pl-4">
                            <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 '선택적 동의'를 한 경우 및 법령의 규정에 의거하는 경우에는 예외로 합니다.</p>
                            <p>회사는 고객에게 더 나은 서비스 제공을 위하여 아래와 같이 제3자에게 개인정보를 제공하고 있습니다.</p>
                            
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-[11px] md:text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-900">
                                            <th className="border-b border-r border-gray-200 p-3 w-1/4">개인정보를 제공받는 제3자</th>
                                            <th className="border-b border-r border-gray-200 p-3 w-1/4">제공 목적</th>
                                            <th className="border-b border-r border-gray-200 p-3 w-1/4">제공되는 정보</th>
                                            <th className="border-b border-gray-200 p-3 w-1/4">이용 및 보유 기간</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600">
                                        <tr>
                                            <td className="border-r border-b border-gray-200 p-3 font-medium text-gray-800">주식회사 굿가드솔루션</td>
                                            <td rowSpan={3} className="border-r border-gray-200 p-3 align-middle bg-white">
                                                타겟팅 광고를 통해 광고주 제품들 및 서비스들을 홍보하기 위해
                                            </td>
                                            <td rowSpan={3} className="border-r border-gray-200 p-3 align-middle bg-white">
                                                당사에 의해 수집된 모든 데이터 (성명, 이메일, 그리고 전화번호와 같은 프로필 정보뿐만 아니라, 이미지들 및 신체적 특성들에 관한 데이터를 포함하여)
                                            </td>
                                            <td rowSpan={3} className="p-3 align-middle bg-white">
                                                홍보 활동들의 종료 시 즉시 파기될 것임 (최대 3년)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border-r border-b border-gray-200 p-3 font-medium text-gray-800">주식회사 하이솔루션</td>
                                        </tr>
                                        <tr>
                                            <td className="border-r border-gray-200 p-3 font-medium text-gray-800">에니스 컴퍼니</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                                <p className="font-bold mb-1">※ 동의 거부권 및 불이익 안내</p>
                                <p>고객님은 위와 같은 개인정보의 제3자 제공에 동의하지 않을 권리가 있습니다. 본 제공 동의는 선택 사항이므로, 동의를 거부하시더라도 {settings.company_name}의 기본 서비스(회원가입 및 상품 구매 등) 이용에는 전혀 제한이 없습니다. (단, 동의 거부 시 개인정보를 제공받는 제3자가 제공하는 맞춤형 혜택 및 특정 제휴 서비스 이용이 제한될 수 있습니다.)</p>
                            </div>
                        </div>
                    </section>

                    {/* 6. 수집한 개인정보의 처리 위탁 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            6. 수집한 개인정보의 처리 위탁
                        </h2>
                        <div className="pl-4">
                            <p className="mb-3 text-gray-600">회사는 서비스 이행(배송 업무 등)을 위해 아래와 같이 외부 전문업체에 업무를 위탁하여 운영하고 있습니다.</p>
                            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">위탁 대상자</p>
                                    <p className="font-bold text-gray-900">택배사</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">위탁업무 내용</p>
                                    <p className="font-bold text-gray-900">상품 배송</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7. 이용자 및 법정대리인의 권리와 그 행사방법 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            7. 이용자 및 법정대리인의 권리와 그 행사방법
                        </h2>
                        <div className="pl-4 space-y-4 text-gray-600">
                            <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지를 요청할 수도 있습니다.</p>
                            <p>이용자들의 개인정보 조회, 수정을 위해서는 "개인정보변경"(또는 "회원정보수정" 등)을, 가입 해지(동의 철회)를 위해서는 "회원탈퇴"를 클릭하여 본인 확인 절차를 거치신 후 직접 열람, 정정 또는 탈퇴가 가능합니다. 혹은 개인정보보호책임자에게 이메일로 연락하시면 지체 없이 조치하겠습니다.</p>
                            <p>귀하가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리 결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.</p>
                            <p>회사는 이용자의 요청에 의해 해지 또는 삭제된 개인정보는 "회사가 수집하는 개인정보의 보유 및 이용기간"에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.</p>
                        </div>
                    </section>

                    {/* 8. 개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            8. 개인정보 자동수집 장치의 설치, 운영 및 그 거부에 관한 사항
                        </h2>
                        <div className="pl-4 space-y-6">
                            <p className="text-gray-600">회사는 귀하의 정보를 수시로 저장하고 찾아내는 "쿠키(cookie)" 등을 운용합니다. 쿠키란 웹사이트를 운영하는데 이용되는 서버가 귀하의 브라우저에 보내는 아주 작은 텍스트 파일로서 귀하의 컴퓨터 하드디스크에 저장됩니다.</p>
                            
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">쿠키 등 사용 목적</h4>
                                <p className="text-gray-600">회원과 비회원의 접속 빈도나 방문 시간 등을 분석, 이용자의 취향과 관심분야를 파악 및 자취 추적, 각종 이벤트 참여 정도 및 방문 회수 파악 등을 통한 타겟 마케팅 및 개인 맞춤 서비스 제공</p>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">쿠키 설정 거부 방법</h4>
                                <p className="text-gray-600 mb-3">귀하는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 귀하는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
                                <div className="bg-gray-50 p-4 rounded-lg text-xs">
                                    <p className="font-bold text-gray-700 mb-1">설정방법 예 (인터넷 익스플로러의 경우)</p>
                                    <p className="text-gray-500">웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보</p>
                                </div>
                                <p className="mt-3 text-xs text-red-500">※ 단, 귀하께서 쿠키 설치를 거부하였을 경우 서비스 제공에 어려움이 있을 수 있습니다.</p>
                            </div>
                        </div>
                    </section>

                    {/* 9. 개인정보에 관한 민원서비스 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            9. 개인정보에 관한 민원서비스
                        </h2>
                        <div className="pl-4">
                            <p className="mb-6 text-gray-600">회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>
                            
                            <div className="bg-gray-900 text-white rounded-xl p-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-cinzel), serif' }}>Data Protection Officer</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Company Name</p>
                                            <p className="text-lg font-bold">{settings.company_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">E-mail Address</p>
                                            <p className="text-lg font-bold">{settings.cs_email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-[60px] font-black pointer-events-none">
                                    MONO
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="pt-8 border-t border-gray-100 text-center text-[10px] text-gray-400">
                        본 개인정보처리방침은 2025년 4월 28일부터 적용됩니다.
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
