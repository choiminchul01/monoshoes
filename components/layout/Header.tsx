"use client";

import Link from "next/link";
import { Search, ShoppingBag, Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminPermissions } from "@/lib/useAdminPermissions";

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
    const [searchTerm, setSearchTerm] = useState("");

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleShop = () => setIsShopExpanded(!isShopExpanded);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/shop?search=${encodeURIComponent(searchTerm)}`;
            setIsSearchOpen(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-20 items-center justify-between px-4 gap-4">
                    {/* Mobile: Menu Button + Logo Group */}
                    <div className="flex items-center gap-2 md:gap-0">
                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            onClick={toggleMobileMenu}
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="text-2xl md:text-3xl font-bold tracking-wider flex-shrink-0 flex gap-0.5" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                            {"ESSENTIA".split("").map((letter, i) => (
                                <span
                                    key={i}
                                    className="transition-all duration-500 ease-out hover:text-[#D4AF37] hover:scale-110 inline-block"
                                >
                                    {letter}
                                </span>
                            ))}
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium">
                        <Link href="/about/inspection" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                            INSPECTION
                        </Link>
                        <div className="relative group">
                            <Link href="/shop" className="hover:text-[#C41E3A] hover:font-bold transition-all py-4">
                                SHOP
                            </Link>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-48 z-50">
                                <div className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg p-4 flex flex-col gap-3 text-center">
                                    <Link href="/shop?category=BAG" className="text-gray-600 hover:text-[#C41E3A] hover:font-bold text-xs tracking-widest transition-colors">BAG</Link>
                                    <Link href="/shop?category=WALLET" className="text-gray-600 hover:text-[#C41E3A] hover:font-bold text-xs tracking-widest transition-colors">WALLET</Link>
                                    <Link href="/shop?category=SHOES" className="text-gray-600 hover:text-[#C41E3A] hover:font-bold text-xs tracking-widest transition-colors">SHOES</Link>
                                    <Link href="/shop?category=ACCESSORY" className="text-gray-600 hover:text-[#C41E3A] hover:font-bold text-xs tracking-widest transition-colors">ACCESSORY</Link>
                                </div>
                            </div>
                        </div>
                        <Link href="/event" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                            EVENT
                        </Link>
                        <Link href="/cs" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                            C/S
                        </Link>
                        <div className="relative group">
                            <Link href="/partner" className="hover:text-[#C41E3A] hover:font-bold transition-all py-4">
                                PARTNER
                            </Link>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:block w-48 z-50">
                                <div className="bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg p-4 flex flex-col gap-3 text-center">
                                    <Link href="/partner/inquiry" className="text-gray-600 hover:text-[#C41E3A] hover:font-bold text-xs tracking-widest transition-colors">제휴문의</Link>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {/* Icons & Auth */}
                    <div className="flex items-center">
                        {/* Search Bar */}
                        <div className="relative hidden md:block mr-4">
                            <input
                                type="text"
                                placeholder="SEARCH"
                                className="pl-10 pr-4 py-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-48 transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>

                        {/* Mobile Search Icon (visible only on mobile) */}
                        <button
                            className="md:hidden hover:text-gray-600 transition-colors mr-6 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center -m-2.5"
                            onClick={() => setIsSearchOpen(true)}
                        >
                            <Search className="h-6 w-6" />
                        </button>

                        <Link href="/cart" className="hover:text-gray-600 transition-colors relative mr-8 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center -m-2.5">
                            <ShoppingBag className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#C41E3A] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth Links */}
                        <div className="hidden md:flex items-center gap-4 text-sm font-medium border-l border-gray-200 pl-8">
                            {loading ? (
                                <span className="text-gray-400">...</span>
                            ) : user ? (
                                <>
                                    {/* Admin Link if role exists */}
                                    <AdminLink />
                                    <Link href="/mypage" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                                        MYPAGE
                                    </Link>
                                    <button onClick={signOut} className="hover:text-[#C41E3A] hover:font-bold transition-all">
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                                        LOGIN
                                    </Link>
                                    <div className="relative group">
                                        <Link href="/signup" className="hover:text-[#C41E3A] hover:font-bold transition-all">
                                            JOIN
                                        </Link>
                                        <div className="absolute top-full right-0 md:right-1/2 md:translate-x-1/2 mt-4 w-max pointer-events-none z-50">
                                            <div className="bg-[#00704A] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg animate-bounce relative">
                                                회원가입시 5,000원 쿠폰
                                                <div className="absolute -top-1 right-2 md:right-1/2 md:translate-x-1/2 w-2.5 h-2.5 bg-[#00704A] rotate-45"></div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
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
                            className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white z-50 shadow-xl md:hidden overflow-y-auto"
                        >
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-xl font-bold tracking-widest">MENU</span>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 hover:bg-gray-100 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="space-y-4">
                                        <button
                                            onClick={toggleShop}
                                            className="flex items-center justify-between text-lg font-medium hover:text-[#C41E3A] w-full"
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
                                                    <div className="pl-4 flex flex-col gap-3 text-sm text-gray-600 pb-2">
                                                        <Link href="/shop?category=BAG" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C41E3A] hover:font-bold transition-colors">BAG</Link>
                                                        <Link href="/shop?category=WALLET" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C41E3A] hover:font-bold transition-colors">WALLET</Link>
                                                        <Link href="/shop?category=SHOES" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C41E3A] hover:font-bold transition-colors">SHOES</Link>
                                                        <Link href="/shop?category=ACCESSORY" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C41E3A] hover:font-bold transition-colors">ACCESSORY</Link>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <Link href="/about/inspection" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-[#C41E3A]">
                                        INSPECTION
                                    </Link>
                                    <Link href="/event" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-[#C41E3A]">
                                        EVENT
                                    </Link>

                                    <Link href="/cs" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-[#C41E3A]">
                                        C/S
                                    </Link>

                                    <div className="space-y-3">
                                        <Link href="/partner" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium hover:text-[#C41E3A] block">
                                            PARTNER
                                        </Link>
                                        <div className="pl-4 flex flex-col gap-3 text-sm text-gray-600">
                                            <Link href="/partner/inquiry" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#C41E3A] hover:font-bold transition-colors">제휴문의</Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    {user ? (
                                        <div className="flex flex-col gap-3">
                                            {/* Admin Link for Mobile */}
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
                                            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center w-full py-3 border border-black font-bold hover:bg-gray-50 transition-colors relative flex items-center justify-center gap-2">
                                                JOIN
                                                <span className="bg-[#00704A] text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                                    + 5,000원 쿠폰
                                                </span>
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
                                    <h2 className="text-2xl font-bold mb-8 tracking-widest">SEARCH</h2>
                                    <form onSubmit={handleSearchSubmit} className="w-full max-w-md relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="What are you looking for?"
                                            autoFocus
                                            className="w-full text-xl border-b-2 border-black py-4 pl-2 pr-12 outline-none placeholder:text-gray-300"
                                        />
                                        <button
                                            type="submit"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
                                        >
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
