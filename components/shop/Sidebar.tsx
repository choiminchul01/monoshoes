"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BRANDS = [
    "ACNE STUDIOS",
    "ALEXANDER MCQUEEN",
    "BALENCIAGA",
    "BOTTEGA VENETA",
    "BURBERRY",
    "CELINE",
    "CHANEL",
    "CHLOE",
    "DELVAUX",
    "DIOR",
    "FENDI",
    "GIVENCHY",
    "GOYARD",
    "GUCCI",
    "HERMES",
    "LOEWE",
    "LORO PIANA",
    "LOUIS VUITTON",
    "MAISON MARGIELA",
    "MIU MIU",
    "MONCLER",
    "PRADA",
    "SAINT LAURENT",
    "THOM BROWNE",
    "TODS",
    "VALENTINO",
];

export function Sidebar() {
    const searchParams = useSearchParams();
    const selectedBrand = searchParams.get("brand")?.toUpperCase();
    const selectedCategory = searchParams.get("category");

    // Ensure brands are sorted alphabetically
    const sortedBrands = [...BRANDS].sort();

    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-hide">
                <h2 className="mb-6 text-lg font-bold tracking-widest">BRAND</h2>
                <ul className="space-y-3 text-sm">
                    {sortedBrands.map((brand) => {
                        const isSelected = selectedBrand === brand;
                        const href = selectedCategory
                            ? `/shop?category=${selectedCategory}&brand=${brand.toLowerCase()}`
                            : `/shop?brand=${brand.toLowerCase()}`;

                        return (
                            <li key={brand}>
                                <Link
                                    href={href}
                                    className={`block font-serif tracking-wide transition-all ${isSelected
                                        ? "text-black font-bold"
                                        : "text-gray-500 hover:text-black hover:font-bold"
                                        }`}
                                >
                                    {brand}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </aside>
    );
}
