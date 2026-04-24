const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/home/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add state for salePage
c = c.replace('const [newPage, setNewPage] = useState(1);', 'const [newPage, setNewPage] = useState(1);\n  const [salePage, setSalePage] = useState(1);');

// 2. Add filtering for sale items
const filterOld = `  // NEW ARRIVALS: 최근 90일 이내 등록된 상품 (created_at 기준)
  const recommendedItems = products.filter(p =>
    new Date(p.created_at) >= ninetyDaysAgo
  );`;

const filterNew = `  // NEW ARRIVALS: 최근 90일 이내 등록된 상품 (created_at 기준)
  const recommendedItems = products.filter(p =>
    new Date(p.created_at) >= ninetyDaysAgo
  );

  // SPECIAL PRICE: discount_percent > 0 인 상품
  const saleItems = products.filter(p => p.discount_percent && p.discount_percent > 0);`;

c = c.replace(filterOld, filterNew);

// 3. Add pagination calculation
const pageCalcOld = `  const newTotalPages = Math.ceil(recommendedItems.length / itemsPerPage);`;
const pageCalcNew = `  const newTotalPages = Math.ceil(recommendedItems.length / itemsPerPage);\n  const saleTotalPages = Math.ceil(saleItems.length / itemsPerPage);`;

c = c.replace(pageCalcOld, pageCalcNew);

// 4. Add current items calculation
const currentOld = `  const currentNewItems = recommendedItems.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage);`;
const currentNew = `  const currentNewItems = recommendedItems.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage);\n  const currentSaleItems = saleItems.slice((salePage - 1) * itemsPerPage, salePage * itemsPerPage);`;

c = c.replace(currentOld, currentNew);

// 5. Add the actual UI section after NEW ARRIVALS
const newSectionStr = `        {/* SPECIAL PRICE - 4순위 */}
        {saleItems.length > 0 && (
          <section className="mb-32">
            <div className="mb-16 text-center">
              <p className="text-[#C41E3A] text-[10px] tracking-[0.4em] font-black uppercase mb-3">Special Price</p>
              <div className="inline-block">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                  SALE
                </h2>
                <div className="w-full h-[2px] bg-black mx-auto"></div>
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
      <EventPopup />`;

c = c.replace(/      <\/div>\n      <EventPopup \/>/g, newSectionStr);

fs.writeFileSync(path, c, 'utf8');
console.log('Added Special Price section to homepage.');
