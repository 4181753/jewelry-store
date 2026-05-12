"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import content from '@/data/site-content.json';

export const Header = () => {
  const pathname = usePathname();
  const brands = content.brands;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tighter uppercase">
          {content.site.name}
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={cn(
              "text-[11px] font-bold tracking-widest uppercase transition-colors hover:text-black/60",
              pathname === "/" ? "text-black" : "text-zinc-400"
            )}
          >
            Home
          </Link>
          {brands.map((brand) => (
            <div key={brand.id} className="group relative">
              <Link
                href={`/${brand.id}`}
                className={cn(
                  "text-[11px] font-bold tracking-widest uppercase transition-colors hover:text-black h-16 flex items-center",
                  pathname === `/${brand.id}` ? "text-black" : "text-zinc-400"
                )}
              >
                {brand.name}
              </Link>
              
              {/* Category Dropdown */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-48 bg-white border border-gray-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 py-4 z-50">
                {["All", "Bracelets", "Lanyards", "Rings", "Necklaces", "Earrings"].filter(cat => 
                  cat === "All" || content.products.some(p => p.brandId === brand.id && p.category === cat)
                ).map((cat) => (
                  <Link
                    key={cat}
                    href={`/${brand.id}?category=${cat}`}
                    className="block px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-gray-50 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
};
