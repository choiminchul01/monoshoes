"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { MainBanner } from "@/components/home/MainBanner";
import BrandSlider from "@/components/home/BrandSlider";
import { supabase } from "@/lib/supabase";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EventPopup from "@/components/home/EventPopup";
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
  const [celebPage, setCelebPage] = useState(1);
  const [newPage, setNewPage] = useState(1);

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

  // CELEB'S PICK: is_celeb_pick이 true인 상품
  const celebPickItems = products.filter(p => p.is_celeb_pick);

  // NEW ARRIVALS: 최근 90일 이내 등록된 상품 (created_at 기준)
  const recommendedItems = products.filter(p =>
    new Date(p.created_at) >= ninetyDaysAgo
  );

  // 페이지네이션 계산
  const bestTotalPages = Math.ceil(weeklyBestItems.length / itemsPerPage);
  const celebTotalPages = Math.ceil(celebPickItems.length / itemsPerPage);
  const newTotalPages = Math.ceil(recommendedItems.length / itemsPerPage);

  // 현재 페이지 아이템
  const currentBestItems = weeklyBestItems.slice((bestPage - 1) * itemsPerPage, bestPage * itemsPerPage);
  const currentCelebItems = celebPickItems.slice((celebPage - 1) * itemsPerPage, celebPage * itemsPerPage);
  const currentNewItems = recommendedItems.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage);

  return (
    <>
      <MainBanner />
      <BrandSlider />

      <div className="container mx-auto px-4 py-12">
        {/* BEST SELLERS */}
        <section className="mb-24">
          <div className="mb-8 text-center">
            <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Featured</p>
            <h1 className="text-2xl font-medium tracking-tight">BEST SELLERS</h1>
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

        {/* NEW ARRIVALS */}
        <section className="mb-24">
          <div className="mb-8 text-center">
            <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Featured</p>
            <h1 className="text-2xl font-medium tracking-tight">NEW ARRIVALS</h1>
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

        {/* CELEB'S PICK - 맨 마지막에 위치 */}
        {celebPickItems.length > 0 && (
          <section className="mb-24">
            <div className="mb-8 text-center">
              <p className="text-xs text-[#C41E3A] mb-2 tracking-widest uppercase">Style Check</p>
              <h1 className="text-2xl font-medium tracking-tight">CELEB'S PICK</h1>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 md:gap-x-16">
              {loading ? (
                [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} aspectRatio="aspect-[3/4]" />)
              ) : (
                currentCelebItems.map((product, idx) => {
                  // 셀럽픽 이미지 인덱스가 지정되어 있으면 해당 이미지 사용, 아니면 첫번째 이미지
                  const celebImageIndex = product.celeb_pick_image_index ?? 0;
                  const celebImageUrl = product.images?.[celebImageIndex] || product.images?.[0];
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      brand={product.brand}
                      name={product.name}
                      price={product.price}
                      imageUrl={celebImageUrl}
                      aspectRatio="aspect-[3/4]"
                      index={idx}
                      discount_percent={product.discount_percent}
                      is_best={product.is_best}
                      is_new={product.is_new}
                      originalPrice={product.original_price}
                    />
                  );
                })
              )}
            </div>
            <SimplePagination
              currentPage={celebPage}
              totalPages={celebTotalPages}
              onPageChange={setCelebPage}
            />
          </section>
        )}
      </div>
      <EventPopup />
    </>
  );
}
