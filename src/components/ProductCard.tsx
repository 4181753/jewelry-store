"use client";

import React, { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import content from '@/data/site-content.json';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  originalPrice: string;
  salePrice: string;
  rating: number;
  images: string[];
  brandId?: string;
  category?: string;
}

export const ProductCard = ({ product }: { product: Product }) => {
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [detailImgIndex, setDetailImgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : ['/placeholder.jpg'];
  const hasMultipleImages = images.length > 2;

  // Auto-play for detail images (dynamic interval)
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const intervalTime = (content.site as any).productDetailInterval || 1000;
    if (showDetail && images.length > 1 && !isPaused) {
      intervalId = setInterval(() => {
        setDetailImgIndex((prev) => (prev + 1) % images.length);
      }, intervalTime);
    }
    return () => clearInterval(intervalId);
  }, [showDetail, images.length, isPaused]);
  
  const contacts = (content.site.contacts || []).filter((c: any) => 
    !['Facebook', 'Zalo'].includes(c.label)
  );

  const original = parseFloat(product.originalPrice?.replace('$', '').replace(/,/g, '')) || 0;
  const sale = parseFloat(product.salePrice?.replace('$', '').replace(/,/g, '')) || 0;
  const discount = original > 0 ? Math.round(((original - sale) / original) * 100) : 0;

  const conversion = content.site.conversion || {};

  return (
    <>
      <div 
        className="group relative w-full h-full flex flex-col bg-white overflow-hidden cursor-pointer" 
        onMouseEnter={() => {
          // Preload first 2 detail images
          images.slice(0, 2).forEach(src => {
            const img = new Image();
            img.src = src;
          });
        }}
        onMouseLeave={() => setCurrentImgIndex(0)}
        onClick={() => setShowDetail(true)}
      >
        {/* 1:1 Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5 uppercase tracking-tighter">1:1 Craft</span>
          </div>

          {/* Multi-Image Display Logic */}
          <div className="relative w-full h-full">
            {images.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`${product.name} ${idx}`} 
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-700",
                  idx === currentImgIndex 
                    ? (currentImgIndex === 0 && images.length >= 2 
                        ? "group-hover:opacity-0 group-hover:scale-110" 
                        : "opacity-100 scale-100 group-hover:scale-110")
                    : (currentImgIndex === 0 && idx === 1 
                        ? "opacity-0 group-hover:opacity-100 group-hover:scale-110" 
                        : "opacity-0 scale-100")
                )}
              />
            ))}
          </div>

          {/* Carousel Navigation (Only if > 2 images) */}
          {hasMultipleImages && (
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-full text-black hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                className="w-8 h-8 flex items-center justify-center bg-white/80 rounded-full text-black hover:bg-white transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Carousel Indicators */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300", 
                    idx === currentImgIndex ? "w-4 bg-black" : "w-1 bg-black/20"
                  )}
                />
              ))}
            </div>
          )}
          
          {/* Info - Inside Image at Bottom (Hidden on Hover) */}
          <div className="absolute bottom-0 left-0 w-full pb-2 px-4 pt-10 text-center md:text-left transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-4 z-20 bg-gradient-to-t from-white/40 via-white/10 to-transparent">
            <h3 className="text-[11px] font-medium tracking-tight text-zinc-800 uppercase line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-0.5">
              <span className="text-[10px] text-zinc-400 line-through font-medium">
                Official Price ${product.originalPrice?.replace('$', '')}
              </span>
              <span className="text-[12px] text-zinc-900 font-bold tracking-tight">
                Replica ${product.salePrice?.replace('$', '')}
              </span>
              {discount > 0 && (
                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 font-bold">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* Bottom Right Contact Icons (Appears on Hover) */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
            {contacts.map((contact: any) => {
              const isWhatsApp = contact.label.toLowerCase().includes('whatsapp');
              const hasQR = !!contact.qrCode;

              return (
                <div key={contact.id} className="relative group/icon">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasQR) {
                        setShowQR(contact.qrCode);
                      } else {
                        window.open(contact.href, '_blank');
                      }
                    }}
                    style={{ backgroundColor: contact.color || '#000' }}
                    className={cn(
                      "flex items-center justify-center text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all relative border border-white/20",
                      isWhatsApp 
                        ? "w-11 h-11 opacity-100 ring-2 ring-white/30 animate-pulse-slow" 
                        : "w-9 h-9 opacity-80 md:opacity-60 md:hover:opacity-100"
                    )}
                    title={isWhatsApp && hasQR ? "Click for QR Code" : `Inquire on ${contact.label}`}
                  >
                    <span className={cn("font-black uppercase", isWhatsApp ? "text-[14px]" : "text-[10px]")}>
                      {contact.label.substring(0, 1)}
                    </span>
                    
                    {/* Tooltip Label */}
                    <span className={cn(
                      "absolute right-full mr-3 px-2 py-1 bg-black text-white text-[8px] font-black uppercase whitespace-nowrap transition-opacity pointer-events-none rounded-sm",
                      isWhatsApp ? "opacity-100" : "opacity-0 group-hover/icon:opacity-100"
                    )}>
                      {isWhatsApp && hasQR ? "Scan QR" : contact.label}
                    </span>

                    {isWhatsApp && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white/20"></span>
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* QR Code Modal Overlay */}
          {showQR && (
            <div 
              className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
              onClick={(e) => { e.stopPropagation(); setShowQR(null); }}
            >
              <div 
                className="bg-white p-2 shadow-2xl relative animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowQR(null)}
                  className="absolute -top-8 right-0 text-white hover:text-red-400 transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center">
                  <img src={showQR} alt="QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="mt-4 text-center space-y-1">
                  <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.1em] animate-pulse">Free Gift with First Order</p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Buy 2, 40% OFF on 2nd Item • Scan to Chat</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showDetail && (
        <div 
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-150"
          onClick={() => setShowDetail(false)}
        >
          <div 
            className="bg-white w-full max-w-6xl h-auto max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in duration-200 rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 z-[210] p-2 bg-zinc-100 hover:bg-zinc-200 text-black transition-colors rounded-full"
            >
              <X size={24} />
            </button>

            {/* Left: Image Carousel (Full Size) */}
            <div 
              className="w-full md:w-[60%] h-[40vh] md:h-auto relative bg-zinc-50 group/detail-img"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={product.name} 
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500",
                    idx === detailImgIndex ? "opacity-100" : "opacity-0"
                  )}
                />
              ))}
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setDetailImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full text-black hover:bg-white transition-all shadow-sm opacity-0 group-hover/detail-img:opacity-100 z-20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setDetailImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full text-black hover:bg-white transition-all shadow-sm opacity-0 group-hover/detail-img:opacity-100 z-20"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {images.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setDetailImgIndex(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === detailImgIndex ? "w-6 bg-black" : "w-1.5 bg-black/20 hover:bg-black/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Info Section */}
            <div className="w-full md:w-[40%] p-6 md:p-10 flex flex-col overflow-y-auto bg-white">
              <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                  {product.brandId || 'Master Craft'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-black uppercase tracking-tight leading-none mb-6">
                {product.name}
              </h2>

              <div className="space-y-6 flex-1">
                {/* Price */}
                <div className="pb-6 border-b border-zinc-100">
                  <div className="flex items-baseline gap-4 mb-1">
                    <span className="text-3xl font-black text-black">${product.salePrice?.replace('$', '')}</span>
                    <span className="text-zinc-400 line-through text-sm font-medium">Official Price ${product.originalPrice?.replace('$', '')}</span>
                  </div>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    Synchronized with Official Collection • Indistinguishable Quality
                  </p>
                </div>

                {/* Craftsmanship Info */}
                <div className="space-y-6">
                  {Object.entries(conversion).map(([key, val]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase text-black tracking-[0.15em] flex items-center gap-2">
                        <Star size={10} className="fill-black" /> {val.title}
                      </h4>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                        {val.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs - Direct QR Code Display */}
              <div className="mt-10 pt-8 border-t border-zinc-100 flex flex-col items-center">
                {contacts.map((contact: any) => {
                  const isWhatsApp = contact.label.toLowerCase().includes('whatsapp');
                  const hasQR = !!contact.qrCode;

                  if (isWhatsApp && hasQR) {
                    return (
                      <div key={contact.id} className="flex flex-col items-center gap-4 w-full">
                        <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-sm group/qr relative">
                          <img src={contact.qrCode} alt="WhatsApp QR" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/qr:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.1em] animate-pulse">Free Gift with First Order</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Buy 2, 40% OFF on 2nd Item • Scan to Chat</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button 
                      key={contact.id}
                      onClick={() => window.open(contact.href, '_blank')}
                      style={{ backgroundColor: contact.color || '#000' }}
                      className="w-full py-4 mt-4 text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-black/5"
                    >
                      Inquire via {contact.label}
                    </button>
                  );
                })}
                <p className="text-[9px] text-center text-zinc-400 font-bold uppercase tracking-widest mt-8">
                  Secure Encrypted Transaction • Global Express Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
