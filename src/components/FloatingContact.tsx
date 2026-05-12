import React from 'react';
import content from '@/data/site-content.json';

export const FloatingContact = () => {
  const contacts = (content.site.contacts || []).filter((c: any) => 
    !['Facebook', 'Zalo'].includes(c.label)
  );
  
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      {contacts.map((contact) => {
        const isWhatsApp = contact.label.toLowerCase().includes('whatsapp');
        
        return (
          <div key={contact.id} className="group relative flex flex-col items-end">
            {/* QR Code for WhatsApp - Always Visible */}
            {isWhatsApp && contact.qrCode && (
              <div className="mb-2 p-3 bg-white shadow-2xl border border-zinc-100 rounded-lg animate-in slide-in-from-bottom-2 duration-500 flex flex-col items-center">
                <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Scan QR Code</p>
                <div className="w-32 h-32">
                  <img src={contact.qrCode} alt="Scan QR" className="w-full h-full object-contain" />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">Free Gift with First Order</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Buy 2, 40% OFF on 2nd Item</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
