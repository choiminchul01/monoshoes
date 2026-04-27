"use client";

import Link from "next/link";
import { Search, ShoppingBag, Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminPermissions } from "@/lib/useAdminPermissions";

// 카테고리 상수
const WOMEN_CATEGORIES = [
    { label: "슬링백/뮬", href: "/shop?gender=W&category=W_SLINGBACK" },
    { label: "플랫/로퍼", href: "/shop?gender=W&category=W_FLAT" },
    { label: "펌프스/힐", href: "/shop?gender=W&category=W_HEELS" },
    { label: "샌들/슬리퍼", href: "/shop?gender=W&category=W_SANDAL" },
    { label: "스니커즈", href: "/shop?gender=W&category=W_SNEAKERS" },
    { label: "부츠/워커", href: "/shop?gender=W&category=W_BOOTS" },
    { label: "레인부츠", href: "/shop?gender=W&category=W_RAIN" },
];

const MEN_CATEGORIES = [
    { label: "구두/옥스퍼드", href: "/shop?gender=M&category=M_OXFORD" },
    { label: "로퍼/슬립온", href: "/shop?gender=M&category=M_LOAFER" },
    { label: "스니커즈", href: "/shop?gender=M&category=M_SNEAKERS" },
    { label: "샌들/슬리퍼", href: "/shop?gender=M&category=M_SANDAL" },
    { label: "부츠/워커", href: "/shop?gender=M&category=M_BOOTS" },
    { label: "캐주얼화", href: "/shop?gender=M&category=M_CASUAL" },
    { label: "레인부츠", href: "/shop?gender=M&category=M_RAIN" },
];

function AdminLink() {
    const { role } = useAdminPermissions();
    if (!role) return null;
    return (
        <Link href="/admin" className="hover:text-[#C41E3A] hover:font-bold transition-all text-[#C41E3A]">
            ADMIN
        </Link>
    );
}

function AdminMobileLink({ onClick }: { onClick: () => void }) {
    const { role } = useAdminPermissions();
    if (!role) return null;
    return (
        <Link
            href="/admin"
            onClick={onClick}
            className="text-center w-full py-3 bg-[#C41E3A] text-white font-bold hover:bg-[#A01830] transition-colors"
        >
            ADMIN PAGE
        </Link>
    );
}

export function Header() {
    const { cartCount } = useCart();
    const { user, loading, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isShopExpanded, setIsShopExpanded] = useState(false);
    const [mobileShopGender, setMobileShopGender] = useState<"W" | "M">("W");
    const [searchTerm, setSearchTerm] = useState("");

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleShop = () => setIsShopExpanded(!isShopExpanded);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchTerm.trim();
        if (trimmed.length < 2) {
            alert("2글자 이상 입력해주세요.");
            return;
        }
        window.location.href = `/shop?search=${encodeURIComponent(trimmed)}`;
        setIsSearchOpen(false);
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md">
                <div className="w-full bg-[#003d2b] overflow-hidden py-2 border-b border-white/10">
                    <motion.div 
                        className="flex whitespace-nowrap will-change-transform"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ 
                            duration: 35, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                    >
                        {[...Array(40)].map((_, i) => (
                            <span key={i} className="text-white text-[13px] font-medium px-12 tracking-wider">
                                모노슈즈와 함께하는 프리미엄 풋웨어 라이프
                            </span>
                        ))}
                    </motion.div>
                </div>
                <div className="w-full border-b border-gray-200">
                    <div className="w-full px-4 md:px-12 lg:px-16 flex h-20 items-center justify-between gap-4 relative">
                        {/* Left: Mobile Menu + Desktop Nav */}
                        <div className="flex items-center flex-1">
                            <button
                                className="md:hidden p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center mr-2"
                                onClick={toggleMobileMenu}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold tracking-widest">
                                <Link href="/event" className="hover:text-[#C41E3A] transition-all py-4">이벤트</Link>
                                <Link href="/shop?filter=best" className="hover:text-[#C41E3A] transition-all py-4">베스트</Link>
                                <Link href="/shop?filter=new" className="hover:text-[#C41E3A] transition-all py-4">신상품</Link>
                                <div className="relative group">
                                    <Link href="/shop" className="hover:text-[#C41E3A] transition-all py-4 flex items-center gap-1">
                                        SHOP
                                        <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
                                    </Link>
                                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block w-[400px] z-50">
                                        <div className="bg-white border border-gray-100 shadow-xl rounded-xl p-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[13px] font-black tracking-[0.3em] text-[#C41E3A] mb-3 pb-2 border-b border-gray-100">WOMEN</p>
                                                    <div className="flex flex-col gap-2">
                                                        {WOMEN_CATEGORIES.map((cat) => (
                                                            <Link key={cat.href} href={cat.href} className="text-[13px] text-gray-600 font-medium hover:text-black hover:font-bold transition-colors">{cat.label}</Link>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black tracking-[0.3em] text-gray-500 mb-3 pb-2 border-b border-gray-100">MEN</p>
                                                    <div className="flex flex-col gap-2">
                                                        {MEN_CATEGORIES.map((cat) => (
                                                            <Link key={cat.href} href={cat.href} className="text-[13px] text-gray-600 font-medium hover:text-black hover:font-bold transition-colors">{cat.label}</Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Link href="/shop?filter=sale" className="hover:text-[#C41E3A] transition-all py-4 text-[#C41E3A]">특가</Link>
                            </nav>
                        </div>

                        {/* Center: Logo */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                            <Link href="/home" className="group relative flex items-center justify-center min-w-[150px] md:min-w-[200px]">
                                <span className="text-xl md:text-2xl font-black tracking-[0.1em] text-black transition-all duration-300 group-hover:opacity-0 group-hover:invisible" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                                    MONO SHOES
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl font-bold tracking-[0.1em] text-black opacity-0 invisible transition-all duration-300 group-hover:opacity-100 group-hover:visible whitespace-nowrap" style={{ fontFamily: "'S-Core Dream', sans-serif", fontWeight: 600 }}>
                                    모노 슈즈
                                </span>
                            </Link>
                        </div>

                        {/* Right: Icons & Auth */}
                        <div className="flex items-center justify-end flex-1 gap-2 md:gap-0">
                            <form onSubmit={handleSearchSubmit} className="relative hidden lg:block mr-4">
                                <input
                                    type="text"
                                    placeholder="신발 검색"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black w-32 xl:w-44 transition-all"
                                />
                                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Search className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            </form>
                            <button className="lg:hidden hover:text-gray-600 transition-colors p-2.5 flex items-center justify-center" onClick={() => setIsSearchOpen(true)}>
                                <Search className="h-6 w-6" />
                            </button>
                            <Link href="/cart" id="header-cart-icon" className="hover:text-gray-600 transition-colors relative md:mr-8 p-2.5 flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                            <div className="hidden md:flex items-center gap-4 text-sm font-medium border-l border-gray-200 pl-8">
                                {loading ? (
                                    <span className="text-gray-400">...</span>
                                ) : user ? (
                                    <>
                                        <AdminLink />
                                        <Link href="/mypage" className="hover:text-[#C41E3A] hover:font-bold transition-all">MYPAGE</Link>
                                        <button onClick={signOut} className="hover:text-[#C41E3A] hover:font-bold transition-all">LOGOUT</button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="hover:text-[#C41E3A] hover:font-bold transition-all">LOGIN</Link>
                                        <Link href="/signup" className="hover:text-[#C41E3A] hover:font-bold transition-all">JOIN</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
            </div>
        </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-50 shadow-xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-lg font-black tracking-[0.2em]" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                                        MONO SHOES
                                    </span>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1 flex-1">
                                    <Link href="/event" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold tracking-widest hover:text-[#C41E3A] py-3 border-b border-gray-50">
                                        이벤트
                                    </Link>
                                    <Link href="/shop?filter=best" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold tracking-widest hover:text-[#C41E3A] py-3 border-b border-gray-50">
                                        베스트
                                    </Link>
                                    <Link href="/shop?filter=new" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold tracking-widest hover:text-[#C41E3A] py-3 border-b border-gray-50">
                                        신상품
                                    </Link>

                                    {/* SHOP 아코디언 */}
                                    <div className="border-b border-gray-50">
                                        <button
                                            onClick={toggleShop}
                                            className="flex items-center justify-between text-base font-semibold tracking-widest hover:text-[#C41E3A] w-full py-3"
                                        >
                                            SHOP
                                            {isShopExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {isShopExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    {/* 성별 탭 */}
                                                    <div className="flex gap-2 mb-3 px-1">
                                                        <button
                                                            onClick={() => setMobileShopGender("W")}
                                                            className={`flex-1 py-2 text-[15px] font-bold tracking-widest rounded-lg transition-colors ${mobileShopGender === "W" ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}
                                                        >
                                                            WOMEN
                                                        </button>
                                                        <button
                                                            onClick={() => setMobileShopGender("M")}
                                                            className={`flex-1 py-2 text-[15px] font-bold tracking-widest rounded-lg transition-colors ${mobileShopGender === "M" ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}
                                                        >
                                                            MEN
                                                        </button>
                                                    </div>
                                                    <div className="pl-2 flex flex-col gap-2 pb-4">
                                                        {(mobileShopGender === "W" ? WOMEN_CATEGORIES : MEN_CATEGORIES).map((cat) => (
                                                            <Link
                                                                key={cat.href}
                                                                href={cat.href}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className="text-sm text-gray-600 font-medium hover:text-black hover:font-bold transition-colors py-1"
                                                            >
                                                                {cat.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <Link href="/shop?filter=sale" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold tracking-widest text-[#C41E3A] py-3">
                                        특가
                                    </Link>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    {user ? (
                                        <div className="flex flex-col gap-3">
                                            <AdminMobileLink onClick={() => setIsMobileMenuOpen(false)} />
                                            <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)} className="text-center w-full py-3 border border-black font-bold hover:bg-black hover:text-white transition-colors">
                                                MYPAGE
                                            </Link>
                                            <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="text-center w-full py-3 bg-gray-100 font-bold hover:bg-gray-200 transition-colors">
                                                LOGOUT
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center w-full py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors">
                                                LOGIN
                                            </Link>
                                            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center w-full py-3 border border-black font-bold hover:bg-gray-50 transition-colors">
                                                JOIN
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
                        />
                        <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 w-full h-[50vh] z-[61] bg-white md:hidden rounded-b-2xl shadow-xl overflow-hidden"
                        >
                            <div className="container mx-auto px-4 py-4 h-full flex flex-col">
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="p-2.5 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    >
                                        <X className="h-8 w-8" />
                                    </button>
                                </div>
                                <div className="flex-1 flex flex-col items-center pt-8">
                                    <h2 className="text-2xl font-bold mb-8 tracking-widest">신발 검색</h2>
                                    <form onSubmit={handleSearchSubmit} className="w-full max-w-md relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="찾으시는 신발을 검색해보세요"
                                            autoFocus
                                            className="w-full text-xl border-b-2 border-black py-4 pl-2 pr-12 outline-none placeholder:text-gray-300"
                                        />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2">
                                            <Search className="h-6 w-6" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
