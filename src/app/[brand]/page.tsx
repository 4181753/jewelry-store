import { ProductCard } from "@/components/ProductCard";
import content from "@/data/site-content.json";
import { notFound } from "next/navigation";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { brand: brandId } = await params;
  const { page: pageStr, category: selectedCategory } = await searchParams;
  
  const brand = content.brands.find((b) => b.id === brandId);
  if (!brand) notFound();

  const allCategories = ["All", "Bracelets", "Lanyards", "Rings", "Necklaces", "Earrings"];
  const brandAllProducts = content.products.filter((p) => p.brandId === brandId);
  
  // Filter categories to only show those that have products for this brand
  const categories = allCategories.filter(cat => 
    cat === "All" || brandAllProducts.some(p => p.category === cat)
  );

  let brandProducts = brandAllProducts;
  
  if (selectedCategory && selectedCategory !== "All") {
    brandProducts = brandProducts.filter(p => p.category === selectedCategory);
  }

  const itemsPerPage = 20;
  const currentPage = parseInt(pageStr || "1");
  const totalPages = Math.ceil(brandProducts.length / itemsPerPage);
  
  const paginatedProducts = brandProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Brand Banner - Full Width */}
      <div className="relative h-[50vh] w-full bg-gray-100 overflow-hidden">
        <img 
          src={brand.image} 
          alt={brand.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white space-y-4 px-4">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase">{brand.name}</h1>
          </div>
        </div>

        {/* Boutique Sync - Positioned at bottom of banner */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-full flex justify-center px-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-white/10 bg-black/40 backdrop-blur-xl rounded-full">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/90 whitespace-nowrap">
              {content.site.boutiqueSyncText}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full px-0 pb-20">
        {/* Category Navigation */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-40 overflow-x-auto no-scrollbar">
          <div className="container mx-auto px-4 flex items-center justify-center h-14 gap-8 min-w-max">
            {categories.map((cat) => (
              <a
                key={cat}
                href={`/${brandId}?category=${cat}`}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-black ${
                  (selectedCategory === cat || (!selectedCategory && cat === "All")) 
                    ? "text-black border-b-2 border-black h-14 flex items-center" 
                    : "text-zinc-400 h-14 flex items-center"
                }`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 bg-gray-50 border-t border-b border-gray-100">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <div key={product.id} className="bg-white">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center bg-white">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">No products found in this category</p>
            </div>
          )}
        </div>

        {/* Pagination & Status */}
        {brandProducts.length > 0 && (
          <div className="mt-20 flex flex-col items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              Showing {paginatedProducts.length} of {brandProducts.length} masterpieces
            </p>
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-4">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const catParam = selectedCategory ? `&category=${selectedCategory}` : '';
                  return (
                    <a
                      key={p}
                      href={`/${brandId}?page=${p}${catParam}`}
                      className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-all border ${
                        currentPage === p 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-zinc-400 border-zinc-100 hover:border-black hover:text-black"
                      }`}
                    >
                      {p}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
