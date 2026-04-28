"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { MainBanner } from "@/components/home/MainBanner";
import EventSlider from "@/components/home/EventSlider";
import { supabase } from "@/lib/supabase";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EventPopup from "@/components/home/EventPopup";
import ReviewSlider from "@/components/shop/ReviewSlider";
import PartnerSection from "@/components/home/PartnerSection";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price?: number;
  category: string;
  images: string[];
  description: string;
  stock: number;
  is_available: boolean;
  is_best?: boolean;
  is_new?: boolean;
  is_celeb_pick?: boolean;
  celeb_pick_image_index?: number;
  discount_percent?: number;
  created_at: string;
};

// 간단한 페이지네이션 컴포넌트
function SimplePagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {[...Array(totalPages)].map((_, idx) => {
        const page = idx + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${currentPage === page
              ? 'bg-black text-white'
              : 'border border-gray-300 hover:bg-gray-100'
              }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션 상태 (각 섹션별)
  const [bestPage, setBestPage] = useState(1);
  const [newPage, setNewPage] = useState(1);
  const [salePage, setSalePage] = useState(1);

  // 페이지당 아이템 수 (PC: 8개, 모바일: 4개)
  const [itemsPerPage, setItemsPerPage] = useState(8);

  useEffect(() => {
    // 화면 크기에 따라 페이지당 아이템 수 설정
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(4); // 모바일: 2열 x 2행 = 4개
      } else {
        setItemsPerPage(8); // PC: 4열 x 2행 = 8개
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // 90일 기준으로 신상품 자동 분류
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // BEST SELLERS: is_best가 true인 상품 또는 전체 상품 중 상위 10개
  const weeklyBestItems = products.filter(p => p.is_best).length > 0
    ? products.filter(p => p.is_best)
    : products.slice(0, 10);

  // NEW ARRIVALS: 최근 90일 이내 등록된 상품 (created_at 기준)
  const recommendedItems = products.filter(p => new Date(p.created_at) >= ninetyDaysAgo);

  // SPECIAL PRICE: discount_percent > 0 인 상품
  const saleItems = products.filter(p => p.discount_percent && p.discount_percent > 0);

  // 페이지네이션 계산
  const bestTotalPages = Math.ceil(weeklyBestItems.length / itemsPerPage);
  const newTotalPages = Math.ceil(recommendedItems.length / itemsPerPage);
  const saleTotalPages = Math.ceil(saleItems.length / itemsPerPage);

  // 현재 페이지 아이템
  const currentBestItems = weeklyBestItems.slice((bestPage - 1) * itemsPerPage, bestPage * itemsPerPage);
  const currentNewItems = recommendedItems.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage);
  const currentSaleItems = saleItems.slice((salePage - 1) * itemsPerPage, salePage * itemsPerPage);

  return (
    <>
      <MainBanner />
      <EventSlider />

      <div className="container mx-auto px-4 py-12">

        {/* BEST SELLERS - 2순위 */}
        <section className="mb-32">
          <div className="mb-16 text-center">
            <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Best Seller</p>
            <div className="inline-block">
              <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                BEST
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16">
            {loading ? (
              [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />)
            ) : (
              currentBestItems.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  brand={product.brand}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.images?.[0]}
                  aspectRatio="aspect-[3/4]"
                  index={idx}
                  discount_percent={product.discount_percent}
                  is_best={product.is_best}
                  is_new={product.is_new}
                  originalPrice={product.original_price}
                />
              ))
            )}
          </div>
          <SimplePagination
            currentPage={bestPage}
            totalPages={bestTotalPages}
            onPageChange={setBestPage}
          />
        </section>

        {/* NEW ARRIVALS - 3순위 */}
        <section className="mb-32">
          <div className="mb-16 text-center">
            <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">New Arrival</p>
            <div className="inline-block">
              <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                NEW
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16">
            {loading ? (
              [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />)
            ) : (
              currentNewItems.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  brand={product.brand}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.images?.[0]}
                  aspectRatio="aspect-[3/4]"
                  index={idx}
                  discount_percent={product.discount_percent}
                  is_best={product.is_best}
                  is_new={product.is_new}
                  originalPrice={product.original_price}
                />
              ))
            )}
          </div>
          <SimplePagination
            currentPage={newPage}
            totalPages={newTotalPages}
            onPageChange={setNewPage}
          />
        </section>

        {/* SPECIAL PRICE - 4순위 */}
        {saleItems.length > 0 && (
          <section className="mb-32">
            <div className="mb-16 text-center">
              <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Special Price</p>
              <div className="inline-block">
                <h2 className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                  SALE
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16">
              {loading ? (
                [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />)
              ) : (
                currentSaleItems.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    brand={product.brand}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.images?.[0]}
                    aspectRatio="aspect-[3/4]"
                    index={idx}
                    discount_percent={product.discount_percent}
                    is_best={product.is_best}
                    is_new={product.is_new}
                    originalPrice={product.original_price}
                  />
                ))
              )}
            </div>
            <SimplePagination
              currentPage={salePage}
              totalPages={saleTotalPages}
              onPageChange={setSalePage}
            />
          </section>
        )}
      </div>
      <ReviewSlider />
      <PartnerSection />
      <EventPopup />
    </>
  );
}
