"use client";

import React, { useState } from 'react';
import content from '@/data/site-content.json';
import { X } from 'lucide-react';

export const Footer = () => {
  const [showQR, setShowQR] = useState<string | null>(null);
  const footerData = content.site.footer;
  const siteName = content.site.name;
  
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        {footerData.map((col, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight uppercase">{col.title}</h3>
            {col.type === 'text' ? (
              <div className="text-sm text-gray-500 leading-relaxed space-y-2">
                {col.items.map((item, i) => (
                  <p key={i} className="cursor-pointer hover:text-black hover:bg-gray-50 px-2 py-1 -ml-2 rounded transition-all duration-300">
                    {item}
                  </p>
                ))}
              </div>
            ) : (
              <ul className="text-sm text-gray-500 space-y-3">
                {col.items.map((item, i) => (
                  <li key={i} className="cursor-pointer hover:text-black hover:translate-x-1 transition-all duration-300 border-b border-transparent hover:border-gray-200 w-fit pb-1">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* Connect Column (Fixed for social links) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight uppercase">Connect</h3>
          <ul className="text-sm text-gray-500 space-y-3">
            {(content.site.contacts || []).filter(c => !['Facebook', 'Zalo'].includes(c.label)).map((contact) => {
              const isWhatsApp = contact.label.toLowerCase().includes('whatsapp');
              const hasQR = !!contact.qrCode;

              return (
                <li key={contact.id}>
                  <button 
                    onClick={() => {
                      if (isWhatsApp && hasQR) {
                        setShowQR(contact.qrCode);
                      } else {
                        window.open(contact.href, '_blank');
                      }
                    }}
                    className="hover:text-black transition-colors flex items-center gap-2 group/link"
                  >
                    <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                    {contact.label}
                    {isWhatsApp && hasQR && (
                      <span className="text-[8px] font-black bg-black text-white px-1 py-0.5 rounded ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity">QR</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-50 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowQR(null)}
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
              <img src={showQR} alt="WhatsApp QR" className="w-full h-full object-contain" />
            </div>
            <div className="mt-4 text-center space-y-1">
              <p className="text-[12px] font-black text-red-600 uppercase tracking-[0.1em] animate-pulse">Free Gift with First Order</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Buy 2, 40% OFF on 2nd Item • Scan to Chat</p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
