"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const WOMEN_CATEGORIES = [
    { label: "슬링백/뮬", code: "W_SLINGBACK" },
    { label: "플랫/로퍼", code: "W_FLAT" },
    { label: "펌프스/힐", code: "W_HEELS" },
    { label: "샌들/슬리퍼", code: "W_SANDAL" },
    { label: "스니커즈", code: "W_SNEAKERS" },
    { label: "부츠/워커", code: "W_BOOTS" },
    { label: "레인부츠", code: "W_RAIN" },
];

const MEN_CATEGORIES = [
    { label: "구두/옥스퍼드", code: "M_OXFORD" },
    { label: "로퍼/슬립온", code: "M_LOAFER" },
    { label: "스니커즈", code: "M_SNEAKERS" },
    { label: "샌들/슬리퍼", code: "M_SANDAL" },
    { label: "부츠/워커", code: "M_BOOTS" },
    { label: "캐주얼화", code: "M_CASUAL" },
    { label: "레인부츠", code: "M_RAIN" },
];

interface SidebarProps {
    onFilterSelect?: () => void;
}

export function Sidebar({ onFilterSelect }: SidebarProps) {
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get("category");
    const selectedGender = searchParams.get("gender");

    // 현재 성별에 따라 기본 탭 결정
    const defaultGender = selectedGender === "M" ? "M" : "W";
    const [activeGender, setActiveGender] = useState<"W" | "M">(defaultGender as "W" | "M");

    const [womenOpen, setWomenOpen] = useState(selectedGender === "W" || !selectedGender);
    const [menOpen, setMenOpen] = useState(selectedGender === "M");

    const handleClick = () => {
        if (onFilterSelect) onFilterSelect();
    };

    const currentCategories = activeGender === "W" ? WOMEN_CATEGORIES : MEN_CATEGORIES;

    return (
        <aside className="w-full md:w-56 flex-shrink-0">
            <div className="overflow-y-auto pr-2 scrollbar-hide">

                {/* 전체 보기 */}
                <Link
                    href="/shop"
                    onClick={handleClick}
                    className={`block text-base font-bold tracking-widest mb-6 transition-all ${!selectedCategory && !selectedGender ? "text-black" : "text-gray-400 hover:text-black"}`}
                >
                    ALL SHOES
                </Link>

                {/* 성별 탭 스위치 */}
                <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveGender("W")}
                        className={`flex-1 py-2 text-[15px] font-bold tracking-widest rounded-md transition-all ${activeGender === "W" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
                    >
                        WOMEN
                    </button>
                    <button
                        onClick={() => setActiveGender("M")}
                        className={`flex-1 py-2 text-[15px] font-bold tracking-widest rounded-md transition-all ${activeGender === "M" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}
                    >
                        MEN
                    </button>
                </div>

                {/* 카테고리 목록 */}
                <ul className="space-y-1">
                    {/* 성별 전체 보기 */}
                    <li>
                        <Link
                            href={`/shop?gender=${activeGender}`}
                            onClick={handleClick}
                            className={`block py-2 px-3 text-sm font-semibold tracking-wide rounded-lg transition-all ${
                                selectedGender === activeGender && !selectedCategory
                                    ? "bg-black text-white"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            }`}
                        >
                            {activeGender === "W" ? "여성 전체" : "남성 전체"}
                        </Link>
                    </li>
                    <li className="pt-1 pb-2">
                        <div className="h-px bg-gray-100" />
                    </li>
                    {currentCategories.map((cat) => {
                        const isSelected = selectedCategory === cat.code;
                        return (
                            <li key={cat.code}>
                                <Link
                                    href={`/shop?gender=${activeGender}&category=${cat.code}`}
                                    onClick={handleClick}
                                    className={`block py-2 px-3 text-[14px] tracking-wide rounded-lg transition-all ${
                                        isSelected
                                            ? "bg-black text-white font-bold"
                                            : "text-gray-600 font-medium hover:bg-gray-50 hover:text-black hover:font-bold"
                                    }`}
                                >
                                    {cat.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
}
