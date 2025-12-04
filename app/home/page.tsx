"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { MainBanner } from "@/components/home/MainBanner";
import { supabase } from "@/lib/supabase";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  images: string[];
  description: string;
  stock: number;
  is_available: boolean;
  created_at: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyBestCount, setWeeklyBestCount] = useState(8);
  const [recommendedCount, setRecommendedCount] = useState(4);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Split products for sections (just splitting by index for demo)
  const weeklyBestItems = products.slice(0, 10);
  const recommendedItems = products.slice(10);

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
            {loading ? (
              [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[1000/1618]" />)
            ) : (
              weeklyBestItems.slice(0, weeklyBestCount).map((product, idx) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  brand={product.brand}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.images?.[0]}
                  aspectRatio="aspect-[1000/1618]"
                  index={idx}
                />
              ))
            )}
          </div>
          {!loading && weeklyBestCount < weeklyBestItems.length && (
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
            {loading ? (
              [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[1000/1618]" />)
            ) : (
              recommendedItems.slice(0, recommendedCount).map((product, idx) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  brand={product.brand}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.images?.[0]}
                  aspectRatio="aspect-[1000/1618]"
                  index={idx}
                />
              ))
            )}
          </div>
          {!loading && recommendedCount < recommendedItems.length && (
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
