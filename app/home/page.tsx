"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { MainBanner } from "@/components/home/MainBanner";

const PRODUCTS = [
  {
    id: "1",
    brand: "PRADA",
    name: "Medium Leather Tote Bag",
    price: 3500000,
    originalPrice: 4200000,
    imageUrl: "https://placehold.co/600x800/png?text=Bag+1",
  },
  {
    id: "2",
    brand: "PRADA",
    name: "Re-Nylon Backpack",
    price: 2800000,
    originalPrice: 3300000,
    imageUrl: "https://placehold.co/600x800/png?text=Bag+2",
  },
  {
    id: "3",
    brand: "PRADA",
    name: "Saffiano Leather Wallet",
    price: 850000,
    originalPrice: 1100000,
    imageUrl: "https://placehold.co/600x800/png?text=Wallet+1",
  },
  {
    id: "4",
    brand: "PRADA",
    name: "Monolith Brushed Leather Loafers",
    price: 1450000,
    originalPrice: 1800000,
    imageUrl: "https://placehold.co/600x800/png?text=Shoes+1",
  },
  {
    id: "5",
    brand: "PRADA",
    name: "Embroidered Jersey T-shirt",
    price: 1200000,
    originalPrice: 1500000,
    imageUrl: "https://placehold.co/600x800/png?text=T-shirt+1",
  },
  {
    id: "6",
    brand: "PRADA",
    name: "Nylon Bucket Hat",
    price: 650000,
    originalPrice: 800000,
    imageUrl: "https://placehold.co/600x800/png?text=Hat+1",
  },
  {
    id: "7",
    brand: "PRADA",
    name: "Small Leather Shoulder Bag",
    price: 2900000,
    originalPrice: 3600000,
    imageUrl: "https://placehold.co/600x800/png?text=Bag+3",
  },
  {
    id: "8",
    brand: "PRADA",
    name: "Sunglasses",
    price: 550000,
    originalPrice: 720000,
    imageUrl: "https://placehold.co/600x800/png?text=Glasses+1",
  },
  // Extra items for Weekly Best Load More
  {
    id: "13",
    brand: "PRADA",
    name: "Galleria Saffiano Bag",
    price: 4500000,
    originalPrice: 5500000,
    imageUrl: "https://placehold.co/600x800/png?text=Bag+4",
  },
  {
    id: "14",
    brand: "PRADA",
    name: "Chocolate Brushed Loafers",
    price: 1550000,
    originalPrice: 1900000,
    imageUrl: "https://placehold.co/600x800/png?text=Shoes+2",
  },
  {
    id: "15",
    brand: "PRADA",
    name: "Re-Edition 2005 Bag",
    price: 2500000,
    originalPrice: 3100000,
    imageUrl: "https://placehold.co/600x800/png?text=Bag+5",
  },
  {
    id: "16",
    brand: "PRADA",
    name: "Symbole Sunglasses",
    price: 620000,
    originalPrice: 800000,
    imageUrl: "https://placehold.co/600x800/png?text=Glasses+2",
  },
  // Recommended Items
  {
    id: "9",
    brand: "PRADA",
    name: "Leather Belt",
    price: 650000,
    originalPrice: 800000,
    imageUrl: "https://placehold.co/600x600/png?text=Belt+1",
  },
  {
    id: "10",
    brand: "PRADA",
    name: "Key Trick",
    price: 450000,
    originalPrice: 580000,
    imageUrl: "https://placehold.co/600x600/png?text=Key+1",
  },
  {
    id: "11",
    brand: "PRADA",
    name: "Hair Clip",
    price: 520000,
    originalPrice: 680000,
    imageUrl: "https://placehold.co/600x600/png?text=Clip+1",
  },
  {
    id: "12",
    brand: "PRADA",
    name: "Scarf",
    price: 890000,
    originalPrice: 1100000,
    imageUrl: "https://placehold.co/600x600/png?text=Scarf+1",
  },
  // Extra items for Recommended Load More
  {
    id: "17",
    brand: "PRADA",
    name: "Card Holder",
    price: 420000,
    originalPrice: 550000,
    imageUrl: "https://placehold.co/600x600/png?text=Card+1",
  },
  {
    id: "18",
    brand: "PRADA",
    name: "Phone Case",
    price: 580000,
    originalPrice: 720000,
    imageUrl: "https://placehold.co/600x600/png?text=Case+1",
  },
  {
    id: "19",
    brand: "PRADA",
    name: "Headband",
    price: 490000,
    originalPrice: 630000,
    imageUrl: "https://placehold.co/600x600/png?text=Headband+1",
  },
  {
    id: "20",
    brand: "PRADA",
    name: "Bracelet",
    price: 750000,
    imageUrl: "https://placehold.co/600x600/png?text=Bracelet+1",
  },
];

export default function Home() {
  const [weeklyBestCount, setWeeklyBestCount] = useState(8);
  const [recommendedCount, setRecommendedCount] = useState(4);

  const weeklyBestItems = PRODUCTS.filter(p => !["9", "10", "11", "12", "17", "18", "19", "20"].includes(p.id));
  const recommendedItems = PRODUCTS.filter(p => ["9", "10", "11", "12", "17", "18", "19", "20"].includes(p.id));

  return (
    <div className="flex flex-col min-h-screen -mt-20">
      <MainBanner />

      <div className="container mx-auto px-4 py-12">
        {/* WEEKLY BEST */}
        <section className="mb-24">
          <div className="mb-8 text-center">
            <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Featured</p>
            <h1 className="text-2xl font-medium tracking-tight">BEST SELLERS</h1>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16 mb-12">
            {weeklyBestItems.slice(0, weeklyBestCount).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                aspectRatio="aspect-[1000/1618]"
                originalPrice={product.originalPrice}
              />
            ))}
          </div>
          {weeklyBestCount < weeklyBestItems.length && (
            <div className="flex justify-center">
              <button
                onClick={() => setWeeklyBestCount(prev => prev + 4)}
                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
              >
                Load More
              </button>
            </div>
          )}
        </section>

        {/* RECOMMENDED ITEMS */}
        <section className="mb-24">
          <div className="mb-8 text-center">
            <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Featured</p>
            <h1 className="text-2xl font-medium tracking-tight">NEW ARRIVALS</h1>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16 mb-12">
            {recommendedItems.slice(0, recommendedCount).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                aspectRatio="aspect-square"
                originalPrice={product.originalPrice}
              />
            ))}
          </div>
          {recommendedCount < recommendedItems.length && (
            <div className="flex justify-center">
              <button
                onClick={() => setRecommendedCount(prev => prev + 4)}
                className="px-5 py-1.5 bg-transparent border border-black text-black text-xs font-medium hover:bg-black hover:text-white transition-colors rounded-full tracking-widest uppercase"
              >
                Load More
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
