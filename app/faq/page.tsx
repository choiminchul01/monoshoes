"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = {
    question: string;
    answer: string;
};

type FAQCategory = {
    title: string;
    items: FAQItem[];
};

const faqData: FAQCategory[] = [
    {
        title: "주문/결제",
        items: [
            {
                question: "무통장 입금은 어떻게 하나요?",
                answer: "주문 완료 후 주문 완료 페이지에서 입금 계좌 정보(은행명, 계좌번호, 예금주)를 확인하실 수 있습니다. 주문 금액 전액을 입금하시면 관리자가 확인 후 '입금 완료'로 상태를 변경해드립니다. 입금자명은 주문자명과 동일하게 입금해주시기 바랍니다."
            },
            {
                question: "주문을 취소하고 싶어요",
                answer: "마이페이지 > 주문 내역에서 주문 상태를 확인하신 후, 배송 준비 전 단계라면 고객센터(support@essentia.com)로 연락주시면 취소가 가능합니다. 입금 완료 후 취소 시 환불은 영업일 기준 3~5일 소요되며, 고객님의 계좌로 직접 입금해드립니다."
            },
            {
                question: "결제 확인은 얼마나 걸리나요?",
                answer: "무통장 입금의 경우 입금 후 영업일 기준 1~2일 이내 확인됩니다. 확인 즉시 마이페이지에서 주문 상태가 '입금 완료'로 변경되며, 상품 배송 준비가 시작됩니다."
            },
            {
                question: "영수증 발급이 가능한가요?",
                answer: "네, 가능합니다. 마이페이지 주문 내역에서 현금영수증 및 거래명세서 출력이 가능하며, 세금계산서가 필요하신 경우 고객센터로 문의해주시면 발급해드립니다."
            }
        ]
    },
    {
        title: "배송",
        items: [
            {
                question: "배송은 어떻게 이루어지나요?",
                answer: "입금 확인 후 영업일 기준 2~3일 이내 상품이 발송되며, CJ대한통운을 통해 전국 어디서나 1~2일 내 배송됩니다. 발송 시 마이페이지에서 운송장 번호를 확인하실 수 있으며, 택배사 홈페이지에서 실시간 배송 조회가 가능합니다."
            },
            {
                question: "배송 조회는 어떻게 하나요?",
                answer: "마이페이지 > 주문 내역에서 운송장 번호를 확인하신 후, CJ대한통운 홈페이지에서 배송 조회가 가능합니다. 운송장 번호는 상품 발송 시 자동으로 등록되며, 문자 또는 이메일로도 안내해드립니다."
            },
            {
                question: "배송비는 어떻게 되나요?",
                answer: "전 상품 무료 배송입니다. 단, 제주도 및 도서/산간 지역의 경우 추가 배송비(3,000~5,000원)가 발생할 수 있으며, 주문 시 배송지 입력 후 최종 결제 금액에서 확인하실 수 있습니다."
            },
            {
                question: "상품이 오배송 되었을 때는 어떻게 하나요?",
                answer: "주문하신 상품과 다른 상품이 배송된 경우, 상품 수령 즉시 고객센터(support@essentia.com)로 사진과 함께 연락주시면 정확한 상품으로 무료 재발송해드리며, 오배송 상품은 무료로 회수해드립니다. 배송지 정보 오기입으로 인한 경우, 택배사와 직접 연락하여 재배송을 요청해주셔야 합니다."
            },
            {
                question: "배송지 변경이 가능한가요?",
                answer: "발송 전이라면 배송지 변경이 가능합니다. 고객센터로 연락주시면 즉시 변경해드립니다. 이미 발송된 경우에는 택배사를 통한 배송지 변경이 어려우니, 수령 후 재발송을 원하시면 별도로 안내해드리겠습니다."
            }
        ]
    },
    {
        title: "교환/반품/환불",
        items: [
            {
                question: "상품 수령 후 꼭 확인하세요!",
                answer: "상품 수령 후 상태 확인은 원래의 포장을 최대한 유지해 주셔야 합니다. 포장이 훼손되지 않은 경우만 교환, 환불이 가능합니다. 가방의 경우 손잡이, 스트랩의 포장지를 뜯지 마시고 한쪽으로 밀어서 상품의 하자 여부를 확인하시고, 상품에 이상이 없다고 판단된 경우 제거해 주세요. 손잡이, 스트랩의 포장이 훼손된 경우 반품, 교환이 불가합니다. 상품 불량이 확인된 경우 교환이 가능하며 상품 수령 후 24시간 이내에만 접수가 가능합니다."
            },
            {
                question: "단순 변심으로 교환/반품하고 싶어요",
                answer: "단순 변심에 의한 교환/반품은 상품 수령 후 7일 이내 가능합니다. 단, 상품의 택(tag)이 제거되었거나 착용/사용 흔적이 있는 경우 반품이 불가능하며, 왕복 배송비(6,000원)가 고객 부담입니다. 미세한 스티칭 마감, 접착제 흔적, 미세한 스크래치 정도는 교환 또는 환불 사유에 해당하지 않으니, 구매 전 상세 사진과 리뷰를 꼼꼼히 확인해주시기 바랍니다."
            },
            {
                question: "상품에 하자를 발견했는데 어떻게 하나요?",
                answer: "명확한 상품 하자(찢어짐, 오염, 파손 등)가 있는 경우 상품 수령 후 24시간 이내 고객센터로 연락주시면 무료로 교환 처리해드립니다. 하자 부분을 사진으로 촬영하여 함께 보내주시면 더욱 빠른 처리가 가능합니다. 단, 미세한 마감 차이나 소재 특성은 불량으로 보지 않으니 참고해주세요."
            },
            {
                question: "A/S 신청을 원하시나요?",
                answer: "상품 구매 후 1년 이내 A/S를 원하시는 고객님들은 고객센터(support@essentia.com)로 문의 주세요. 담당 직원이 A/S 상세 내용을 확인 후 브랜드 공식 A/S 센터로 연결해드립니다. 특별한 경우가 아닌 이상 A/S는 무상으로 제공되며, 배송비만 고객 부담입니다. 자세한 사항은 문의 답변을 통해 안내드리겠습니다."
            },
            {
                question: "환불은 어떻게 받나요?",
                answer: "교환/반품 승인 후 상품이 반송 완료되면 영업일 기준 3~5일 이내 환불 처리됩니다. 무통장 입금의 경우 주문 시 입력하신 환불 계좌로 직접 입금해드리며, 환불 완료 시 문자 또는 이메일로 안내해드립니다. 단순 변심에 의한 반품의 경우 왕복 배송비를 제외한 금액이 환불됩니다."
            }
        ]
    },
    {
        title: "회원/계정",
        items: [
            {
                question: "회원가입은 필수인가요?",
                answer: "네, 주문을 위해서는 회원가입이 필요합니다. 회원가입 시 입력하신 정보(연락처, 주소)는 주문서에 자동으로 입력되어 더욱 편리하게 쇼핑하실 수 있으며, 마이페이지에서 주문 내역 조회도 가능합니다."
            },
            {
                question: "비밀번호를 잊어버렸어요",
                answer: "로그인 페이지에서 '비밀번호 찾기'를 클릭하시면 가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다. 이메일이 도착하지 않는 경우 스팸 메일함을 확인해주시거나 고객센터로 문의해주세요."
            },
            {
                question: "개인정보 수정은 어떻게 하나요?",
                answer: "로그인 후 마이페이지 > 회원정보 수정에서 연락처, 주소, 비밀번호 등을 변경하실 수 있습니다. 이메일 주소는 계정 식별자이므로 변경이 불가능하며, 변경을 원하시면 고객센터로 문의해주세요."
            },
            {
                question: "회원 탈퇴하고 싶어요",
                answer: "마이페이지 하단의 '회원 탈퇴' 메뉴를 통해 탈퇴하실 수 있습니다. 진행 중인 주문이 있거나 미처리된 문의사항이 있는 경우 탈퇴가 제한될 수 있으며, 탈퇴 시 모든 주문 내역 및 포인트가 삭제되어 복구가 불가능합니다."
            }
        ]
    },
    {
        title: "상품",
        items: [
            {
                question: "재고 확인은 어떻게 하나요?",
                answer: "상품 상세 페이지에서 실시간 재고를 확인하실 수 있습니다. 품절된 상품은 '품절' 표시가 되며, 재입고 알림 신청을 하시면 재입고 시 문자 또는 이메일로 안내해드립니다."
            },
            {
                question: "정품 보증이 되나요?",
                answer: "네, ESSENTIA에서 판매하는 모든 상품은 100% 정품이며, 정품 보증서를 함께 발송해드립니다. 만약 정품이 아닌 것으로 판명될 경우 전액 환불 및 보상해드리니 안심하고 구매하셔도 됩니다."
            },
            {
                question: "상품 문의는 어떻게 하나요?",
                answer: "상품 상세 페이지 하단의 '상품 문의' 게시판에 글을 남겨주시거나, 고객센터(support@essentia.com)로 이메일 보내주시면 자세히 안내해드립니다. 영업일 기준 24시간 이내 답변드립니다."
            },
            {
                question: "상품 사진과 실물이 다를 수 있나요?",
                answer: "상품 사진은 실물을 최대한 정확하게 표현하고자 노력하고 있으나, 모니터 해상도와 환경에 따라 색상이 다소 차이가 있을 수 있습니다. 정품 명품의 경우 조명에 따라 색감이 달라 보일 수 있으니, 색상 차이로 인한 단순 변심 반품 시 왕복 배송비가 발생하오니 구매 전 신중히 확인 부탁드립니다."
            }
        ]
    }
];

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

    const toggleItem = (categoryIndex: number, itemIndex: number) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">자주 묻는 질문(FAQ)</h1>
                    <p className="text-gray-600">
                        고객님들이 자주 묻는 질문과 답변을 확인하세요
                    </p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {faqData.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Category Title */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                            </div>

                            {/* FAQ Items */}
                            <div className="divide-y divide-gray-200">
                                {category.items.map((item, itemIndex) => {
                                    const key = `${categoryIndex}-${itemIndex}`;
                                    const isOpen = openItems[key];

                                    return (
                                        <div key={itemIndex}>
                                            {/* Question */}
                                            <button
                                                onClick={() => toggleItem(categoryIndex, itemIndex)}
                                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="flex items-start gap-3 flex-1">
                                                    <span className="text-green-600 font-bold text-lg">Q.</span>
                                                    <span className="font-medium text-gray-900">{item.question}</span>
                                                </div>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${isOpen ? "transform rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            {/* Answer */}
                                            {isOpen && (
                                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-gray-500 font-bold text-lg">A.</span>
                                                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <h3 className="text-xl font-bold mb-3">찾으시는 답변이 없으신가요?</h3>
                    <p className="text-gray-600 mb-6">
                        고객센터로 문의주시면 친절하게 답변해드리겠습니다.
                    </p>
                    <div className="space-y-2">
                        <p className="text-gray-700">
                            <span className="font-medium">이메일:</span> support@essentia.com
                        </p>
                        <p className="text-gray-700">
                            <span className="font-medium">운영시간:</span> 평일 09:00 - 18:00 (주말/공휴일 휴무)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
