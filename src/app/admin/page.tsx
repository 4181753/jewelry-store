"use client";

import React, { useMemo, useState } from 'react';

const initialState = {
  siteName: 'Luxury Redefined',
  brandName: 'Cartier',
  copy: 'Premium 1:1 Craftsmanship Jewelry.',
  bottomInfo: 'Original Mold Reconstruction.',
  whatsapp: 'https://wa.me/628123456789',
  facebook: 'https://facebook.com',
  zalo: 'https://zalo.me',
};

export default function AdminToolPage() {
  const [form, setForm] = useState(initialState);
  const [bulkText, setBulkText] = useState('');

  const products = useMemo(() => {
    return bulkText
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row, index) => {
        const [showcase, zoom, name, originalPrice, salePrice] = row.split(',').map((item) => item.trim());
        return { id: index + 1, showcase, zoom, name, originalPrice, salePrice };
      });
  }, [bulkText]);

  return (
    <main className="min-h-screen bg-[#f6f3ef] px-4 py-10 text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-6 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Website Modification Tool</p>
            <h1 className="text-3xl font-semibold tracking-tight">Edit brand content, products, media, and contacts</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(form).map(([key, value]) => (
              <label key={key} className="space-y-2 text-sm font-medium">
                <span className="capitalize text-gray-600">{key}</span>
                <input
                  value={value}
                  onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                  className="w-full rounded-2xl border border-black/10 bg-[#fcfcfc] px-4 py-3 outline-none transition focus:border-black"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 text-xl font-semibold">Bulk Upload Products</h2>
            <p className="mb-4 text-sm text-gray-500">Use one product per line: showcase image, zoom image, product name, original price, sale price.</p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="min-h-72 w-full rounded-2xl border border-black/10 bg-[#fcfcfc] p-4 font-mono text-sm outline-none focus:border-black"
              placeholder="showcase.jpg, zoom.jpg, Product Name, $100, $60"
            />
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 text-xl font-semibold">Live Preview</h2>
            <div className="space-y-4 rounded-2xl bg-black p-6 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Site Name</p>
                <p className="text-2xl font-semibold">{form.siteName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Brand</p>
                <p className="text-xl">{form.brandName}</p>
              </div>
              <div className="grid gap-2 text-sm text-white/80">
                <p>{form.copy}</p>
                <p>{form.bottomInfo}</p>
                <p>{form.whatsapp}</p>
                <p>{form.facebook}</p>
                <p>{form.zalo}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {products.slice(0, 6).map((product) => (
                <div key={product.id} className="rounded-2xl border border-black/10 p-4 text-sm">
                  <p className="font-semibold">{product.name || 'Untitled Product'}</p>
                  <p className="text-gray-500">{product.originalPrice} → {product.salePrice}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
