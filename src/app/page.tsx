"use client";

import React, { useState } from "react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { ShieldCheck, Gem, Sparkles, ChevronRight } from "lucide-react";
import content from "@/data/site-content.json";
import { cn } from "@/lib/utils";

export default function Home() {
  const brands = content.brands;
  const conversion = content.site.conversion;
  const allCategories = ["All", "Bracelets", "Lanyards", "Rings", "Necklaces", "Earrings"];

  // State to track active category for each brand
  const [brandCategories, setBrandCategories] = useState<Record<string, string>>({});
  // State to track current page for each brand
  const [brandPages, setBrandPages] = useState<Record<string, number>>({});

  return (
    <main className="flex flex-col">
      <HeroCarousel />

      {/* 3-Layer Conversion Section (White Background) */}
      <section className="py-16 bg-white border-b border-gray-50 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Layer 1: Emotional / Craft */}
            <div className="group text-center md:text-left">
              <div className="mx-auto md:mx-0 w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <Gem size={28} strokeWidth={1} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight text-black uppercase whitespace-nowrap">{conversion.emotional.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {conversion.emotional.description}
              </p>
            </div>

            {/* Layer 2: Technical / Quality */}
            <div className="group text-center md:text-left">
              <div className="mx-auto md:mx-0 w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <ShieldCheck size={28} strokeWidth={1} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight text-black uppercase whitespace-nowrap">{conversion.technical.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {conversion.technical.description}
              </p>
            </div>

            {/* Layer 3: CTA / Urgency */}
            <div className="group text-center md:text-left">
              <div className="mx-auto md:mx-0 w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 group-hover:bg-black group-hover:text-white transition-all duration-500">
                <Sparkles size={28} strokeWidth={1} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight text-black uppercase whitespace-nowrap">{conversion.cta.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {conversion.cta.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brands & Products Sections */}
      <div className="py-8 bg-white space-y-8">
        <div className="w-full px-0">
          {brands.map((brand) => {
            const activeCategory = brandCategories[brand.id] || "All";
            const currentPage = brandPages[brand.id] || 1;
            const itemsPerPage = 8;
            
            // Filter products for this brand
            const brandAllProducts = content.products.filter((p) => p.brandId === brand.id);
            
            // Available categories for this brand
            const availableCategories = allCategories.filter(cat => 
              cat === "All" || brandAllProducts.some(p => p.category === cat)
            );

            // Filter products by active category
            const filteredProducts = activeCategory === "All" 
              ? brandAllProducts 
              : brandAllProducts.filter(p => p.category === activeCategory);

            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            const displayedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            const setPage = (page: number) => {
              setBrandPages(prev => ({ ...prev, [brand.id]: page }));
            };

            const handleCategoryChange = (cat: string) => {
              setBrandCategories(prev => ({ ...prev, [brand.id]: cat }));
              setBrandPages(prev => ({ ...prev, [brand.id]: 1 }));
            };

            return (
              <section key={brand.id} className="mb-8 last:mb-0">
                {/* Brand Banner (Full Width) */}
                <Link href={`/${brand.id}`} className="block relative w-full h-64 md:h-96 mb-1 overflow-hidden group">
                  <img 
                    src={brand.image} 
                    alt={brand.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter uppercase transition-all duration-700 group-hover:tracking-widest">{brand.name}</h2>
                  </div>
                </Link>

                {/* Brand Category Filter */}
                <div className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
                  <div className="container mx-auto px-4 flex items-center justify-center h-12 gap-6 min-w-max">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-black border-b-2 ${
                          activeCategory === cat 
                            ? "text-black border-black" 
                            : "text-zinc-300 border-transparent"
                        } h-12 flex items-center`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Products Grid - Full Width */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 bg-gray-50 border-t border-b border-gray-100 mb-4 min-h-[400px]">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map((product) => (
                      <div key={product.id} className="bg-white">
                        <ProductCard product={product} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-white flex items-center justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">No masterpieces in this category</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-12 mb-8">
                    <button 
                      onClick={() => setPage(currentPage === 1 ? totalPages : currentPage - 1)}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-black transition-all"
                    >
                      Prev
                    </button>
                    
                    <div className="flex flex-col items-center gap-1 min-w-[100px]">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
                        {currentPage} / {totalPages}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                        {filteredProducts.length} Items
                      </span>
                    </div>

                    <button 
                      onClick={() => setPage(currentPage === totalPages ? 1 : currentPage + 1)}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 hover:text-black transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* View All Link */}
                <div className="flex justify-center pb-8">
                  <Link 
                    href={`/${brand.id}${activeCategory !== 'All' ? `?category=${activeCategory}` : ''}`} 
                    className="group/link flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-all duration-700"
                  >
                    <span className="border-b border-transparent group-hover/link:border-black pb-1">Discover the full {brand.name} 1:1 artisanal collection</span>
                    <ChevronRight size={14} className="group-hover/link:translate-x-2 transition-transform duration-700" />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
