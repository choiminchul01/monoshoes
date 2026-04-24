const fs = require('fs');
const path = 'c:/Users/Master/Desktop/납품전용 작업/monoshoes/app/home/page.tsx';
let c = fs.readFileSync(path, 'utf8');

const targetStr = `        </section>
      </div>
      <EventPopup />
    </>`;

const normalizedC = c.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');

if (normalizedC.includes(normalizedTarget)) {
    const replacement = `        </section>

        {/* SPECIAL PRICE - 4순위 */}
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
      <EventPopup />
    </>`;
    const newC = normalizedC.replace(normalizedTarget, replacement);
    fs.writeFileSync(path, newC, 'utf8');
    console.log('Successfully inserted SALE section JSX');
} else {
    console.log('Target string still not found.');
}
