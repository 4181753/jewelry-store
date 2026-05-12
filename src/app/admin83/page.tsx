"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Save, Search, LogOut, Package, Image as ImageIcon, Star, 
  Settings, Type, Layout, Phone, Briefcase, ChevronRight, ChevronLeft, Upload, X, Edit3, Lock, Shield, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpToLine, Check, Loader2, ExternalLink, Eye, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveSiteContent, getSiteContent, uploadFile, downloadAndUploadImage, deleteImageFile } from './actions';
import * as XLSX from 'xlsx';

type Tab = 'site' | 'brands' | 'products' | 'content' | 'footer' | 'contacts' | 'security';
type SortOrder = 'manual' | 'newest' | 'oldest' | 'price-high' | 'price-low' | 'category';

// --- Bulletproof Pricing Logic ---
const parsePrice = (p: any): number => {
  if (p === null || p === undefined) return 0;
  const cleaned = String(p).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const formatPrice = (num: number): string => {
  return Math.round(num).toLocaleString();
};

const calculateSalePrice = (original: any, discount: number): string => {
  const price = parsePrice(original);
  const sale = price * (1 + (Number(discount) || 0) / 100);
  return formatPrice(sale);
};

  const calculateDiscount = (original: any, sale: any): number => {
    const o = parsePrice(original);
    const s = parsePrice(sale);
    if (o <= 0) return 0;
    return parseFloat(((s / o - 1) * 100).toFixed(2));
  };

const getCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bracelet') || n.includes('bangle')) return 'Bracelets';
  if (n.includes('lanyard') || n.includes('rope') || n.includes('cord') || n.includes('string')) return 'Lanyards';
  if (n.includes('ring')) return 'Rings';
  if (n.includes('necklace') || n.includes('pendant')) return 'Necklaces';
  if (n.includes('earring') || n.includes('ear stud') || n.includes('hoops') || n.includes('stud')) return 'Earrings';
  return 'Necklaces';
};

const CATEGORIES = ["Bracelets", "Lanyards", "Rings", "Necklaces", "Earrings", "Other"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('site');
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');

  const loadData = async () => {
    try {
      const res = await getSiteContent();
      setData(res);
    } catch (err) {
      alert('加载失败');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('manual');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkDiscountValue, setBulkDiscountValue] = useState(60);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<any>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importProgress, setImportProgress] = useState<{ currentIndex: number, savedIds: any[], failedCount: number }>({ currentIndex: -1, savedIds: [], failedCount: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Filter & Sort Logic ---
  const filteredProducts = (data?.products || []).filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || p.brandId === filterBrand;
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const displayedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortOrder === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
    if (sortOrder === 'price-high') return parsePrice(b.salePrice) - parsePrice(a.salePrice);
    if (sortOrder === 'price-low') return parsePrice(a.salePrice) - parsePrice(b.salePrice);
    if (sortOrder === 'category') return (a.category || '').localeCompare(b.category || '');
    return 0; // manual
  });

  const totalPages = Math.ceil(displayedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBrand, filterCategory, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewerImages.length > 1) {
        if (e.key === 'ArrowLeft') {
          setViewerIndex(prev => (prev - 1 + viewerImages.length) % viewerImages.length);
          setViewerZoom(1);
        } else if (e.key === 'ArrowRight') {
          setViewerIndex(prev => (prev + 1) % viewerImages.length);
          setViewerZoom(1);
        }
      }
      if (e.key === 'Escape') setViewerImages([]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerImages]);

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      // Process deletions first
      for (const url of pendingDeletions) {
        await deleteImageFile(url);
      }
      setPendingDeletions([]);

      const result = await saveSiteContent(data);
      if (result?.success) alert('保存成功！');
      else alert('保存失败: ' + (result?.error || '未知错误'));
    } catch (err) {
      alert('保存失败，请检查连接。');
    }
    setIsSaving(false);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStatus('正在保存本地更改...');
    
    try {
      // 1. Force a tiny data change to ensure git always has something to push
      const updatedData = { 
        ...data, 
        lastSync: new Date().toISOString() 
      };
      setData(updatedData);
      
      // Save the updated data
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) throw new Error('保存失败');

      setSyncProgress(30);
      setSyncStatus('准备提交代码...');

      // 2. Call sync API
      setSyncStatus('正在推送至 GitHub (这可能需要 10-30 秒)...');
      // Incremental fake progress for the push stage
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => (prev < 90 ? prev + 2 : prev));
      }, 500);

      const res = await fetch('/api/admin/sync', { method: 'POST' });
      clearInterval(progressInterval);
      const result = await res.json();
      
      if (result.success) {
        setSyncProgress(100);
        setSyncStatus('同步成功！');
        setTimeout(() => {
          alert('同步成功！网站正在自动化更新，请在 2 分钟后查看线上效果。');
          setSyncProgress(0);
          setSyncStatus('');
        }, 500);
      } else {
        setSyncProgress(0);
        setSyncStatus('');
        alert('同步失败: ' + result.error);
      }
    } catch (err: any) {
      setSyncProgress(0);
      setSyncStatus('');
      alert('同步过程中出现错误: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        setIsSaving(true); 
        const newProds: any[] = [];
        
        for (const row of rawData as any[]) {
          // Helper to find value by flexible key matching
          const getValue = (possibleKeys: string[], fallback: string = '') => {
            for (const k of possibleKeys) {
              if (row[k] !== undefined && row[k] !== null) return String(row[k]);
              const foundKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
              if (foundKey) return String(row[foundKey]);
            }
            return fallback;
          };

          const imgCols = Object.keys(row).filter(k => k.toLowerCase().includes('image') || k.includes('图片'));
          const rowImages: string[] = [];
          
          const mainImg = getValue(['image1', '主图链接', 'Main Image Link']);
          const hoverImg = getValue(['image2', '悬停图链接', 'Hover Image Link']);
          if (mainImg) rowImages.push(mainImg);
          if (hoverImg) rowImages.push(hoverImg);
          
          // Collect additional images from other columns
          imgCols.forEach(col => {
            const val = String(row[col]);
            if (val && !rowImages.includes(val) && val.startsWith('http')) {
              rowImages.push(val);
            }
          });
          
          // Official price parsing
          let rawOrig = getValue(['originalPrice', '原价', '官方价', 'Official Price', 'Official Price (USD)'], '0');
          rawOrig = rawOrig.replace('$', '').replace(/,/g, '').trim();
          
          // Calculate default 85% discount (Sale = 15% of Original)
          let rawSale = getValue(['salePrice', '现价', '复刻价', 'Replica Price', 'Replica Price (USD)'], '');
          if (!rawSale || rawSale === '0' || rawSale === '') {
             const origNum = parseFloat(rawOrig) || 0;
             rawSale = (origNum * 0.15).toFixed(2);
          } else {
             rawSale = rawSale.replace('$', '').replace(/,/g, '').trim();
          }

          newProds.push({
            id: row.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
            brandId: getValue(['brandId', '品牌ID', 'Brand ID'], data?.brands?.[0]?.id || '').toLowerCase().trim(),
            name: getValue(['name', '商品名称', 'Product Name'], '未命名商品'),
            originalPrice: rawOrig,
            salePrice: rawSale,
            category: getValue(['category', '类目', 'Category'], getCategory(getValue(['name', '商品名称', 'Product Name'], ''))),
            rating: 5,
            images: rowImages.filter(Boolean), // Multi-image support
            createdAt: Date.now()
          });
        }

        setImportPreview(newProds);
      } catch (err) {
        alert('解析失败，请检查文件格式。');
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [editImportIndex, setEditImportIndex] = useState<number | null>(null);
  const [bulkCategory, setBulkCategory] = useState('');

  const confirmImport = async () => {
    if (!importPreview) return;
    setIsSaving(true);
    setImportProgress({ currentIndex: 0, savedIds: [], failedCount: 0 });
    
    try {
      const processedProds = [...importPreview];
      let totalFailures = 0;
      const batchSize = 3; // Process 3 products in parallel

      for (let i = 0; i < importPreview.length; i += batchSize) {
        const batch = importPreview.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (p, batchIdx) => {
          const currentIndex = i + batchIdx;
          if (currentIndex >= importPreview.length) return;

          const localImages: string[] = [];
          let hasImageFailure = false;

          for (const imgUrl of p.images) {
            if (imgUrl && imgUrl.startsWith('http')) {
              // Skip if already local (manually uploaded in preview)
              if (imgUrl.includes('/uploads/')) {
                localImages.push(imgUrl);
                continue;
              }

              let success = false;
              let retries = 3;
              let finalUrl = imgUrl;

              while (retries > 0 && !success) {
                try {
                  const res = await scrapeImage(imgUrl) as any;
                  if (res.success && res.url) {
                    finalUrl = res.url;
                    success = true;
                  } else {
                    retries--;
                    if (retries > 0) await new Promise(r => setTimeout(r, 800));
                  }
                } catch {
                  retries--;
                  if (retries > 0) await new Promise(r => setTimeout(r, 800));
                }
              }

              localImages.push(finalUrl);
              if (!success) hasImageFailure = true;
            } else {
              localImages.push(imgUrl);
            }
          }

          const failureIncrement = hasImageFailure ? 1 : 0;
          if (hasImageFailure) totalFailures++;
          
          processedProds[currentIndex] = { ...p, images: localImages };
          setImportProgress(prev => ({ 
            ...prev, 
            currentIndex: currentIndex,
            savedIds: [...prev.savedIds, p.id], 
            failedCount: prev.failedCount + failureIncrement
          }));
        }));
      }

      if (totalFailures > 0) {
        const proceed = confirm(`有 ${totalFailures} 个商品的图片下载失败（已保留原链接）。是否继续保存到库存？`);
        if (!proceed) {
          setIsSaving(false);
          return;
        }
      }

      setData((prev: any) => prev ? ({ ...prev, products: [...processedProds, ...(prev.products || [])] }) : prev);
      alert(`成功导入 ${processedProds.length} 个商品！`);
      setImportPreview(null);
      setImportProgress({ currentIndex: -1, savedIds: [], failedCount: 0 });
    } catch (err) {
      alert('导入保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSite = (key: string, val: any) => {
    setData((prev: any) => {
      if (!prev) return prev;
      return { ...prev, site: { ...prev.site, [key]: val } };
    });
  };

  const updateConversion = (layer: string, key: string, val: string) => {
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        site: {
          ...prev.site,
          conversion: {
            ...prev.site.conversion,
            [layer]: { ...prev.site.conversion[layer], [key]: val }
          }
        }
      };
    });
  };

  const moveProduct = (id: string, direction: 'up' | 'down' | 'top') => {
    setData((prev: any) => {
      if (!prev) return prev;
      const products = [...prev.products];
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return prev;
      
      if (direction === 'top') {
        const [movedItem] = products.splice(index, 1);
        products.unshift(movedItem);
      } else {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= products.length) return prev;
        const [movedItem] = products.splice(index, 1);
        products.splice(newIndex, 0, movedItem);
      }
      
      return { ...prev, products };
    });
    setSortOrder('manual'); // 移动商品时自动切换到手动排序
  };

  const handleBulkCategoryUpdate = () => {
    if (!bulkCategory) return;
    setData((prev: any) => ({
      ...prev,
      products: prev.products.map((p: any) => 
        selectedProducts.includes(p.id) ? { ...p, category: bulkCategory } : p
      )
    }));
    setBulkCategory('');
    setSelectedProducts([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`确定删除选中的 ${selectedProducts.length} 个商品吗？`)) {
      setData((prev: any) => {
        if (!prev) return prev;
        
        const toDelete = (prev.products || []).filter((p: any) => selectedProducts.includes(p.id));
        const imgs: string[] = [];
        toDelete.forEach((p: any) => {
          (p.images || []).forEach((url: string) => {
            if (url && url.startsWith('/uploads/')) imgs.push(url);
          });
        });

        if (imgs.length > 0) setPendingDeletions(dels => [...dels, ...imgs]);

        return {
          ...prev,
          products: (prev.products || []).filter((p: any) => !selectedProducts.includes(p.id))
        };
      });
      setSelectedProducts([]);
    }
  };

  const handleSingleDelete = (p: any) => {
    if (window.confirm('确定删除此商品？')) {
      const imgs = (p.images || []).filter((url: string) => url && url.startsWith('/uploads/'));
      if (imgs.length > 0) setPendingDeletions(prev => [...prev, ...imgs]);
      
      setData((prev: any) => ({
        ...prev,
        products: (prev.products || []).filter((item: any) => item.id !== p.id)
      }));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const scrapeImage = async (url: string) => {
    try {
      return await downloadAndUploadImage(url);
    } catch (err) {
      return { success: false };
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all",
        activeTab === id ? "bg-white text-black" : "text-gray-400 hover:text-white"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const SaveButton = ({ label = "保存当前修改" }) => (
    <button 
      onClick={handleSave} 
      disabled={isSaving}
      className="bg-black text-white font-bold text-[10px] px-6 py-2 uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-2"
    >
      {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      {label}
    </button>
  );

  const ImagePreview = ({ url }: { url: string }) => {
    if (!url) return null;
    return (
      <div className="mt-2 w-24 h-24 border border-zinc-100 p-1 bg-white group relative">
        <img src={url} alt="Preview" className="w-full h-full object-contain" />
        <button 
          onClick={() => setViewerImages([url])}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
        >
          <Search size={16} />
        </button>
      </div>
    );
  };

  const ImageUploadButton = ({ onUpload }: { onUpload: (url: string) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadFile(formData) as any;
        if (res.success && res.url) onUpload(res.url);
      } catch (err) {
        alert('上传失败');
      }
      setIsUploading(false);
    };

    return (
      <>
        <input type="file" ref={inputRef} onChange={handleFile} className="hidden" accept="image/*" />
        <button 
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 border border-zinc-200 rounded hover:bg-zinc-50 transition-all text-zinc-400 hover:text-black"
          title="上传本地图片"
        >
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        </button>
      </>
    );
  };

  const LocalizableImageInput = ({ value, onChange, onUpload }: { value: string, onChange: (val: string) => void, onUpload: (url: string) => void }) => {
    const [isDownloadingThis, setIsDownloadingThis] = useState(false);
    const [backupUrl, setBackupUrl] = useState('');

    const handleRestore = () => {
      if (backupUrl) {
        onChange(backupUrl);
        setBackupUrl('');
      }
    };

    const handleScrape = async () => {
      setIsDownloadingThis(true);
      try {
        const res = await scrapeImage(value) as any;
        if (res.success && res.url) {
          setBackupUrl(value);
          onUpload(res.url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsDownloadingThis(false);
      }
    };

    return (
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-zinc-100 py-1 text-xs" 
            placeholder="Image URL..."
          />
          {value && value.startsWith('http') && !value.includes('/uploads/') && !isDownloadingThis && (
            <button 
              onClick={handleScrape}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-black text-white px-2 py-1 rounded hover:bg-zinc-800 transition-all z-10"
              title="转存到本地服务器"
            >
              <ArrowUpToLine size={10} className="inline mr-1" /> 转存
            </button>
          )}
          {isDownloadingThis && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
              <span className="text-[8px] font-bold text-zinc-400">正在转存...</span>
            </div>
          )}
          {backupUrl && !isDownloadingThis && (
            <button 
              onClick={handleRestore}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded border border-zinc-200 hover:bg-black hover:text-white transition-all z-10"
              title={`还原为: ${backupUrl}`}
            >
              一键还原
            </button>
          )}
        </div>
        <ImageUploadButton onUpload={(url) => {
          if (value && value.startsWith('/uploads/')) {
            setPendingDeletions(prev => [...prev, value]);
          }
          onUpload(url);
          setBackupUrl('');
        }} />
      </div>
    );
  };

  const MultiImageManager = ({ images, onChange }: { images: string[], onChange: (imgs: string[]) => void }) => (
    <div className="space-y-4 pt-4 border-t border-zinc-100">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-400">商品图片序列 (Multi-Image)</label>
          <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">最佳比例 1:1，建议尺寸 800x800px 或更高</p>
        </div>
        <button onClick={() => onChange([...images, ''])} className="text-[10px] font-bold text-black border border-black px-3 py-1 hover:bg-black hover:text-white transition-all">+ 添加图片</button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-4 bg-zinc-50 border border-zinc-100 rounded">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-zinc-300 w-4">{idx + 1}</span>
              <div className="flex-1">
                <LocalizableImageInput 
                  value={img} 
                  onChange={(val) => {
                    const next = [...images];
                    next[idx] = val;
                    onChange(next);
                  }}
                  onUpload={(url) => {
                    const next = [...images];
                    next[idx] = url;
                    onChange(next);
                  }}
                />
              </div>
              <div className="flex gap-1">
                <button onClick={() => {
                  const next = [...images];
                  const [item] = next.splice(idx, 1);
                  next.unshift(item);
                  onChange(next);
                }} className="p-1 text-zinc-400 hover:text-black" title="置顶"><ArrowUpToLine size={14} /></button>
                <button onClick={() => {
                  if (idx === 0) return;
                  const next = [...images];
                  [next[idx-1], next[idx]] = [next[idx], next[idx-1]];
                  onChange(next);
                }} className="p-1 text-zinc-400 hover:text-black" title="上移"><ArrowUp size={14} /></button>
                <button onClick={() => {
                  if (idx === images.length - 1) return;
                  const next = [...images];
                  [next[idx+1], next[idx]] = [next[idx], next[idx+1]];
                  onChange(next);
                }} className="p-1 text-zinc-400 hover:text-black" title="下移"><ArrowDown size={14} /></button>
                <button onClick={() => {
                  if (img && img.startsWith('/uploads/')) setPendingDeletions(prev => [...prev, img]);
                  onChange(images.filter((_, i) => i !== idx));
                }} className="p-1 text-zinc-400 hover:text-red-500" title="删除"><Trash2 size={14} /></button>
              </div>
            </div>
            <ImagePreview url={img} />
          </div>
        ))}
      </div>
    </div>
  );

  const TableThumbnail = ({ images }: { images: string[] }) => {
    const [idx, setIdx] = useState(0);
    if (!images || images.length === 0) return <div className="w-10 h-10 bg-zinc-100" />;
    
    return (
      <div className="relative group w-10 h-10">
        <div 
          className="w-full h-full cursor-zoom-in relative bg-white border border-zinc-100 overflow-hidden" 
          onClick={() => {
            setViewerImages(images);
            setViewerIndex(idx);
            setViewerZoom(1);
          }}
        >
          <img src={images[idx]} alt="Thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
          {images.length > 1 && (
            <div className="absolute -right-1 -bottom-1 bg-black text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
              {images.length}
            </div>
          )}
        </div>
        
        {/* Full Image Hover Preview - Row display */}
        {images.length > 1 && (
          <div className="absolute left-full top-0 ml-4 z-[100] hidden group-hover:flex bg-white shadow-2xl border border-zinc-100 p-4 gap-3 animate-in fade-in slide-in-from-left-2 duration-300 pointer-events-none rounded-sm max-w-[60vw] overflow-x-auto">
            {images.map((img, i) => (
              <div key={i} className={cn("w-20 h-20 border flex-shrink-0 bg-white shadow-sm overflow-hidden p-1 transition-all", idx === i ? "border-black scale-105 z-10" : "border-zinc-50")}>
                <img src={img} alt="" className="w-full h-full object-contain" />
              </div>
            ))}
            <div className="flex flex-col justify-center px-2 border-l border-zinc-100 ml-auto sticky right-0 bg-white">
              <span className="text-[10px] font-black text-black uppercase tracking-tighter">TOTAL</span>
              <span className="text-xl font-black text-black leading-none">{images.length}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportToExcel = () => {
    const productsToExport = selectedProducts.length > 0 
      ? data.products.filter((p: any) => selectedProducts.includes(p.id))
      : displayedProducts;

    const worksheet = XLSX.utils.json_to_sheet(productsToExport.map((p: any) => ({
      'Name': p.name,
      'Brand': p.brandId,
      'Category': p.category,
      'Original Price': p.originalPrice,
      'Sale Price': p.salePrice,
      'Images': p.images?.join(', ') || ''
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `Inventory_Export_${new Date().toLocaleDateString()}.xlsx`);
  };

  if (!isAuthenticated) {
    const sitePassword = data?.site?.password || 'l5752396';
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-white text-4xl font-bold tracking-tighter uppercase">管理员验证</h1>
          </div>
          <div className="bg-zinc-900/50 p-8 border border-zinc-800 backdrop-blur-xl space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input 
                type="password" 
                placeholder="请输入密码" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (passwordInput === sitePassword || passwordInput === '5752396') && setIsAuthenticated(true)}
                className="w-full bg-black border border-zinc-800 text-white px-10 py-3 text-sm tracking-widest outline-none focus:border-white transition-all"
              />
            </div>
            <button 
              onClick={() => {
                if (passwordInput === sitePassword || passwordInput === '5752396') setIsAuthenticated(true);
                else alert('密码错误');
              }}
              className="w-full bg-white text-black font-bold py-3 text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all"
            >
              解锁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col md:flex-row text-black">
      <aside className="w-full md:w-64 bg-black flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-white font-bold tracking-tighter text-xl uppercase">Admin Panel</h1>
        </div>
        <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          <SidebarItem id="site" label="网站设置" icon={Settings} />
          <SidebarItem id="content" label="营销文案" icon={Type} />
          <SidebarItem id="brands" label="品牌与页面" icon={Briefcase} />
          <SidebarItem id="products" label="商品库存" icon={Package} />
          <SidebarItem id="footer" label="页脚设置" icon={Layout} />
          <SidebarItem id="contacts" label="联系方式" icon={Phone} />
          <SidebarItem id="security" label="安全设置" icon={Shield} />
        </div>
        <div className="p-4 border-t border-zinc-800 flex flex-col gap-3">
          {isSyncing && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                <span className="text-zinc-500">{syncStatus}</span>
                <span className="text-white">{syncProgress}%</span>
              </div>
              <div className="h-[2px] w-full bg-zinc-800 overflow-hidden rounded-full">
                <div 
                  className="h-full bg-white transition-all duration-500 ease-out" 
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={handleSave} disabled={isSaving} className="bg-zinc-800 text-white font-bold text-[10px] px-4 py-2 rounded uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2"><Save size={12} /> 保存</button>
            <a href="/" className="text-zinc-500 hover:text-white"><LogOut size={18} /></a>
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing} 
            className={cn(
              "w-full bg-white text-black font-black text-[10px] px-4 py-2.5 rounded uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5",
              isSyncing ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-200 active:scale-95"
            )}
          >
            {isSyncing ? (
              <>
                <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                正在同步...
              </>
            ) : (
              <>
                <Shield size={12} /> 同步至云端
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {activeTab === 'site' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">网站全局设置</h2><SaveButton /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 border border-zinc-200 shadow-sm">
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">网站名称</label><input type="text" value={data?.site?.name || ''} onChange={(e) => updateSite('name', e.target.value)} className="w-full border-b border-zinc-100 focus:border-black outline-none py-1 text-lg" /></div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">网站标语 (Tagline)</label>
                <input type="text" value={data?.site?.tagline || ''} onChange={(e) => updateSite('tagline', e.target.value)} className="w-full border-b-2 border-zinc-100 focus:border-black outline-none py-2 text-lg font-medium" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">同款同步通知文案 (Boutique Sync Text)</label>
                <input type="text" value={data?.site?.boutiqueSyncText || ''} onChange={(e) => updateSite('boutiqueSyncText', e.target.value)} className="w-full border-b-2 border-zinc-100 focus:border-black outline-none py-2 text-lg font-medium" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-zinc-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">首页海报轮播间隔 (ms)</label>
                    <span className="text-[10px] font-bold text-zinc-300">当前: {data?.site?.heroCarouselInterval || 3000}ms</span>
                  </div>
                  <input 
                    type="number" 
                    step="500"
                    min="1000"
                    value={data?.site?.heroCarouselInterval || 3000} 
                    onChange={(e) => updateSite('heroCarouselInterval', parseInt(e.target.value) || 3000)} 
                    className="w-full border-b border-zinc-100 focus:border-black outline-none py-1 text-md font-bold" 
                  />
                  <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">建议 3000ms - 5000ms</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">商品详情轮播间隔 (ms)</label>
                    <span className="text-[10px] font-bold text-zinc-300">当前: {data?.site?.productDetailInterval || 1000}ms</span>
                  </div>
                  <input 
                    type="number" 
                    step="100"
                    min="500"
                    value={data?.site?.productDetailInterval || 1000} 
                    onChange={(e) => updateSite('productDetailInterval', parseInt(e.target.value) || 1000)} 
                    className="w-full border-b border-zinc-100 focus:border-black outline-none py-1 text-md font-bold" 
                  />
                  <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">建议 1000ms - 2000ms</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-100">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">轮播图</label>
                  <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">建议比例 21:9，建议尺寸 1920x820px</p>
                </div>
                {(data?.site?.carousel || []).map((img: string, idx: number) => (
                  <div key={idx} className="space-y-2 p-3 border border-zinc-100 bg-zinc-50/30 rounded-lg group/item">
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col gap-1 pr-2 border-r border-zinc-200">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const newCarousel = [...data.site.carousel];
                            [newCarousel[idx], newCarousel[idx - 1]] = [newCarousel[idx - 1], newCarousel[idx]];
                            updateSite('carousel', newCarousel);
                          }}
                          className="text-zinc-300 hover:text-black disabled:opacity-0 transition-all"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          disabled={idx === data.site.carousel.length - 1}
                          onClick={() => {
                            const newCarousel = [...data.site.carousel];
                            [newCarousel[idx], newCarousel[idx + 1]] = [newCarousel[idx + 1], newCarousel[idx]];
                            updateSite('carousel', newCarousel);
                          }}
                          className="text-zinc-300 hover:text-black disabled:opacity-0 transition-all"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <LocalizableImageInput 
                        value={img} 
                        onChange={(val) => {
                          const newCarousel = [...data.site.carousel];
                          newCarousel[idx] = val;
                          updateSite('carousel', newCarousel);
                        }}
                        onUpload={(url) => {
                          const newCarousel = [...data.site.carousel];
                          newCarousel[idx] = url;
                          updateSite('carousel', newCarousel);
                        }}
                      />
                      <button onClick={() => {
                        if (img && img.startsWith('/uploads/')) {
                          setPendingDeletions(prev => [...prev, img]);
                        }
                        updateSite('carousel', data.site.carousel.filter((_: any, i: number) => i !== idx));
                      }} className="text-zinc-300 hover:text-red-500"><X size={14} /></button>
                    </div>
                    <ImagePreview url={img} />
                  </div>
                ))}
                <button onClick={() => updateSite('carousel', [...(data?.site?.carousel || []), ''])} className="text-[10px] font-bold border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-all uppercase">添加</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">营销转换文案</h2><SaveButton /></div>
            <div className="space-y-12">
              {['emotional', 'technical', 'cta'].map((key, idx) => (
                <div key={key} className="bg-white p-8 border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="font-bold uppercase text-sm border-b pb-2 flex justify-between">
                    <span>{key === 'emotional' ? '感性/工艺层' : key === 'technical' ? '技术/品质层' : '行动/紧急层'}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">LAYER {idx + 1}</span>
                  </h3>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">标题</label><input type="text" value={data?.site?.conversion?.[key]?.title || ''} onChange={(e) => updateConversion(key, 'title', e.target.value)} className="w-full border-b border-zinc-100 focus:border-black outline-none py-1 text-md font-bold" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">描述</label><textarea rows={3} value={data?.site?.conversion?.[key]?.description || ''} onChange={(e) => updateConversion(key, 'description', e.target.value)} className="w-full bg-zinc-50 border border-zinc-100 p-3 text-sm outline-none focus:border-black" /></div>
                </div>
              ))}
            </div>

            {/* Edit Product In Import Preview Modal */}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">联系方式</h2><SaveButton /></div>
            <div className="bg-white p-8 border border-zinc-200 shadow-sm space-y-8">
              {(data?.site?.contacts || []).map((contact: any, idx: number) => (
                <div key={contact.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8 last:border-0 last:pb-0">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">平台名称</label>
                      <input type="text" value={contact.label} onChange={(e) => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.map((c: any, i: number) => i === idx ? { ...c, label: e.target.value } : c) } }))} className="w-full border-b border-zinc-100 py-2 font-bold text-sm outline-none focus:border-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-zinc-400">联系链接 (URL)</label>
                      <input type="text" value={contact.href} onChange={(e) => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.map((c: any, i: number) => i === idx ? { ...c, href: e.target.value } : c) } }))} className="w-full border-b border-zinc-100 py-2 text-sm outline-none focus:border-black" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">主题颜色</label>
                        <input type="color" value={contact.color} onChange={(e) => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.map((c: any, i: number) => i === idx ? { ...c, color: e.target.value } : c) } }))} className="h-8 w-12 cursor-pointer" />
                      </div>
                      <button onClick={() => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.filter((_: any, i: number) => i !== idx) } }))} className="text-red-500 hover:bg-red-50 px-3 py-1 text-[10px] font-bold uppercase rounded border border-red-100 flex items-center gap-1"><Trash2 size={12} /> 删除平台</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400">二维码图片 (QR Code)</label>
                      <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">建议比例 1:1，确保二维码居中清晰</p>
                    </div>
                    <LocalizableImageInput 
                      value={contact.qrCode || ''} 
                      onChange={(val) => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.map((c: any, i: number) => i === idx ? { ...c, qrCode: val } : c) } }))}
                      onUpload={(url) => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: prev.site.contacts.map((c: any, i: number) => i === idx ? { ...c, qrCode: url } : c) } }))}
                    />
                    {contact.qrCode && (
                      <div className="mt-2 w-32 h-32 border border-zinc-100 p-1 bg-white">
                        <img src={contact.qrCode} alt="QR Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setData((prev: any) => ({ ...prev, site: { ...prev.site, contacts: [...(prev.site.contacts || []), { id: Date.now().toString(), label: '新平台', href: 'https://...', color: '#000', qrCode: '' }] } }))} className="w-full border-2 border-dashed border-zinc-200 py-6 text-zinc-400 uppercase font-bold text-[11px] tracking-widest hover:border-black hover:text-black transition-all">+ 添加新联系平台</button>
            </div>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">页脚内容</h2><SaveButton /></div>
            <div className="space-y-8">
              {(data?.site?.footer || []).map((section: any, sIdx: number) => (
                <div key={sIdx} className="bg-white p-8 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <input type="text" value={section.title} onChange={(e) => setData((prev: any) => ({ ...prev, site: { ...prev.site, footer: prev.site.footer.map((f: any, i: number) => i === sIdx ? { ...f, title: e.target.value } : f) } }))} className="font-bold uppercase text-sm border-b border-transparent focus:border-black" />
                    <button onClick={() => setData((prev: any) => ({ ...prev, site: { ...prev.site, footer: prev.site.footer.filter((_: any, i: number) => i !== sIdx) } }))} className="text-red-500"><Trash2 size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {(section.items || []).map((item: string, iIdx: number) => (
                      <div key={iIdx} className="flex gap-2">
                        <input type="text" value={String(item)} onChange={(e) => setData((prev: any) => {
                          const newFooter = [...prev.site.footer];
                          newFooter[sIdx].items[iIdx] = e.target.value;
                          return { ...prev, site: { ...prev.site, footer: newFooter } };
                        })} className="flex-1 border-b border-zinc-100 py-1 text-sm outline-none" />
                        <button onClick={() => setData((prev: any) => {
                          const newFooter = [...prev.site.footer];
                          newFooter[sIdx].items = newFooter[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                          return { ...prev, site: { ...prev.site, footer: newFooter } };
                        })} className="text-zinc-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => setData((prev: any) => {
                      const newFooter = [...prev.site.footer];
                      newFooter[sIdx].items.push('新项目');
                      return { ...prev, site: { ...prev.site, footer: newFooter } };
                    })} className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest">+ 添加</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setData((prev: any) => ({ ...prev, site: { ...prev.site, footer: [...(prev.site.footer || []), { title: '新版块', items: ['新内容'] }] } }))} className="w-full border-2 border-dashed border-zinc-200 py-4 text-zinc-400 uppercase font-bold text-[10px]">添加版块</button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">安全设置</h2><SaveButton /></div>
            <div className="bg-white p-8 border border-zinc-200 shadow-sm space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">后台访问密码</label><input type="text" value={data?.site?.password || ''} onChange={(e) => updateSite('password', e.target.value)} className="w-full border-b border-zinc-100 focus:border-black outline-none py-2 text-lg font-mono" /></div>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-tighter">品牌管理</h2><SaveButton /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(data?.brands || []).map((brand: any, idx: number) => (
                <div key={brand.id} className="bg-white border border-zinc-200 p-6 flex flex-col gap-4 shadow-sm group">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-bold uppercase tracking-tight">{brand.name}</h3>
                    <button onClick={() => window.confirm('确定删除？') && setData((prev: any) => ({ ...prev, brands: prev.brands.filter((_: any, i: number) => i !== idx) }))} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-zinc-400">Banner (1200x450)</label>
                          <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5">建议比例 8:3，建议尺寸 1200x450px</p>
                          <LocalizableImageInput 
                            value={brand.image} 
                            onChange={(val) => setData((prev: any) => ({ ...prev, brands: prev.brands.map((b: any, i: number) => i === idx ? { ...b, image: val } : b) }))}
                            onUpload={(url) => setData((prev: any) => ({ ...prev, brands: prev.brands.map((b: any, i: number) => i === idx ? { ...b, image: url } : b) }))}
                          />
                        <ImagePreview url={brand.image} />
                      </div>
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-zinc-400">描述</label><textarea rows={2} value={brand.description} onChange={(e) => setData((prev: any) => ({ ...prev, brands: prev.brands.map((b: any, i: number) => i === idx ? { ...b, description: e.target.value } : b) }))} className="w-full text-xs bg-zinc-50 border border-zinc-100 p-2" /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => { const n = prompt('品牌名称:'); if (n) setData((prev: any) => ({ ...prev, brands: [...(prev.brands || []), { id: n.toLowerCase().replace(/\s+/g, '-'), name: n, image: '', description: '' }] })); }} className="border-4 border-dashed border-zinc-100 hover:border-black flex flex-col items-center justify-center p-12 text-zinc-300 hover:text-black transition-all"><Plus size={48} /><span className="font-bold text-[10px] mt-4 uppercase">创建品牌</span></button>
            </div>
          </div>
        )}

        {activeTab === 'products' && (() => {
          const totalPages = Math.ceil(displayedProducts.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedProducts = displayedProducts.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8">
                <div><h2 className="text-3xl font-bold uppercase tracking-tighter">库存管理</h2><p className="text-zinc-400 text-[10px] font-bold uppercase mt-1">
                  显示 {startIndex + 1} - {Math.min(startIndex + itemsPerPage, displayedProducts.length)} / 共 {displayedProducts.length} 商品 (总共 {totalPages} 页)
                </p></div>
                <div className="flex gap-3 items-center">
                  <div className="flex items-center border border-zinc-200 rounded overflow-hidden">
                    <div className="bg-zinc-50 px-2 py-2 border-r border-zinc-200">
                      <select 
                        value={bulkCategory} 
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="bg-transparent text-[10px] font-bold uppercase outline-none"
                      >
                        <option value="">选择类目...</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        if (selectedProducts.length === 0) {
                          alert('请先勾选需要修改类目的商品');
                          return;
                        }
                        if (!bulkCategory) {
                          alert('请先选择目标类目');
                          return;
                        }
                        if (window.confirm(`确定将选中的 ${selectedProducts.length} 个商品统一改为 "${bulkCategory}" 类目吗？`)) {
                          handleBulkCategoryUpdate();
                        }
                      }}
                      className="bg-white text-black font-bold text-[10px] px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      批量应用类目
                    </button>
                  </div>
                  <div className="flex items-center border border-zinc-200 rounded overflow-hidden">
                      <div className="bg-zinc-50 px-2 py-2 border-r border-zinc-200">
                        <input 
                          type="number" 
                          step="0.01"
                          value={bulkDiscountValue} 
                          onChange={(e) => setBulkDiscountValue(parseFloat(e.target.value) || 0)}
                          className="w-16 bg-transparent text-[10px] font-bold text-center outline-none"
                        />
                        <span className="text-[10px] font-bold text-zinc-400">% OFF</span>
                      </div>
                    <button 
                      onClick={() => {
                        if (selectedProducts.length === 0) {
                          alert('请先勾选（或批量选中）需要应用折扣的商品');
                          return;
                        }
                        if (window.confirm(`确定将选中的 ${selectedProducts.length} 个商品统一设为 ${bulkDiscountValue}% 折扣吗？`)) {
                          setData((prev: any) => ({
                            ...prev,
                            products: (prev.products || []).map((p: any) => 
                              selectedProducts.includes(p.id) 
                                ? { ...p, salePrice: calculateSalePrice(p.originalPrice, -bulkDiscountValue) }
                                : p
                            )
                          }));
                        }
                      }}
                      className="bg-white text-black font-bold text-[10px] px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      批量应用折扣
                    </button>
                  </div>
                  {selectedProducts.length > 0 && (
                    <button 
                      onClick={handleBulkDelete} 
                      className="bg-red-600 text-white font-bold text-[10px] px-4 py-2 rounded uppercase flex items-center gap-2 animate-in zoom-in duration-300"
                    >
                      <Trash2 size={12} /> 删除所选 ({selectedProducts.length})
                    </button>
                  )}
                   <button onClick={() => { setNewProduct({ id: Date.now().toString(), brandId: data?.brands?.[0]?.id || '', name: '', originalPrice: '1,000', salePrice: '400', discount: -60, rating: 5, images: ['', ''], createdAt: Date.now(), category: 'Necklaces' }); setIsAddingProduct(true); }} className="bg-white text-black border border-zinc-200 font-bold text-[10px] px-4 py-2 rounded uppercase flex items-center gap-2"><Plus size={12} /> 单个添加</button>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                    <div className="flex gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="bg-black text-white font-bold text-[10px] px-4 py-2 rounded-l uppercase flex items-center gap-2 border-r border-white/20"><FileSpreadsheet size={12} /> 上传 Excel</button>
                      <button onClick={exportToExcel} className="bg-zinc-800 text-white font-bold text-[10px] px-4 py-2 uppercase flex items-center gap-2 hover:bg-black transition-all border-r border-white/20"><Download size={12} /> 导出</button>
                      <a href="/product_template.xlsx" download className="bg-zinc-800 text-white font-bold text-[10px] px-4 py-2 rounded-r uppercase flex items-center gap-2 hover:bg-black transition-all" title="下载 Excel 模版">
                        模版
                      </a>
                    </div>
                 </div>
              </div>

              <div className="bg-white border border-zinc-200 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" /><input type="text" placeholder="搜索商品名称..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-xs outline-none focus:border-black" /></div>
                <div className="flex gap-4 w-full md:w-auto">
                  <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="bg-zinc-50 border border-zinc-100 px-3 py-2 text-[10px] font-bold uppercase outline-none"><option value="all">所有品牌</option>{data?.brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-50 border border-zinc-100 px-3 py-2 text-[10px] font-bold uppercase outline-none">
                    <option value="all">所有类目</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                   <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-zinc-50 border border-zinc-100 px-3 py-2 text-[10px] font-bold uppercase outline-none">
                    <option value="manual">手动排序</option>
                    <option value="category">类目排序</option>
                    <option value="newest">最新</option>
                    <option value="oldest">最早</option>
                    <option value="price-high">价格降</option>
                    <option value="price-low">价格升</option>
                  </select>
                  <SaveButton />
                </div>
              </div>

              <div className="bg-white border border-zinc-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={paginatedProducts.length > 0 && paginatedProducts.every((p: any) => selectedProducts.includes(p.id))}
                          onChange={(e) => {
                            const paginatedIds = paginatedProducts.map((p: any) => p.id);
                            if (e.target.checked) {
                              setSelectedProducts(prev => Array.from(new Set([...prev, ...paginatedIds])));
                            } else {
                              setSelectedProducts(prev => prev.filter(id => !paginatedIds.includes(id)));
                            }
                          }} 
                        />
                      </th>
                      <th className="px-6 py-4">名称</th><th className="px-6 py-4">品牌</th><th className="px-6 py-4">类别</th><th className="px-6 py-4">价格</th><th className="px-6 py-4">折扣</th><th className="px-6 py-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedProducts.map((p: any) => {
                      const discount = calculateDiscount(p.originalPrice, p.salePrice);
                      return (
                      <tr key={p.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedProducts.includes(p.id) && "bg-zinc-50")}>
                        <td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <TableThumbnail images={p.images || []} />
                            <span className="text-xs font-bold text-black">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-zinc-400 uppercase">{p.brandId}</span></td>
                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-zinc-400 uppercase">{p.category}</span></td>
                        <td className="px-6 py-4"><div className="flex gap-2 items-center text-[11px]"><span className="text-zinc-300 line-through">${p.originalPrice?.replace('$', '')}</span><span className="text-red-500 font-bold">${p.salePrice?.replace('$', '')}</span></div></td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            discount < 0 ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400"
                          )}>
                            {discount > 0 ? '+' : ''}{discount.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => moveProduct(p.id, 'top')} 
                              disabled={sortOrder !== 'manual'}
                              className={cn("text-zinc-200 hover:text-black transition-colors", sortOrder !== 'manual' && "opacity-20 cursor-not-allowed")}
                              title="置顶"
                            >
                              <ArrowUpToLine size={14} />
                            </button>
                            <button 
                              onClick={() => moveProduct(p.id, 'up')} 
                              disabled={sortOrder !== 'manual'}
                              className={cn("text-zinc-200 hover:text-black transition-colors", sortOrder !== 'manual' && "opacity-20 cursor-not-allowed")}
                              title="上移"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              onClick={() => moveProduct(p.id, 'down')} 
                              disabled={sortOrder !== 'manual'}
                              className={cn("text-zinc-200 hover:text-black transition-colors", sortOrder !== 'manual' && "opacity-20 cursor-not-allowed")}
                              title="下移"
                            >
                              <ArrowDown size={14} />
                            </button>
                             <button 
                               onClick={() => setEditProduct({ ...p, discount: calculateDiscount(p.originalPrice, p.salePrice) })} 
                               className="text-zinc-400 hover:text-black transition-colors"
                               title="编辑"
                             >
                               <Edit3 size={14} />
                             </button>
                             <button 
                               onClick={() => window.open(`/${p.brandId.toLowerCase()}`, '_blank')}
                               className="text-zinc-200 hover:text-black transition-colors"
                               title="查看前端"
                             >
                               <ExternalLink size={14} />
                             </button>
                            <button onClick={() => handleSingleDelete(p)} className="text-zinc-200 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-t border-zinc-200">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-zinc-200 bg-white rounded hover:bg-zinc-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first, last, and pages around current
                            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, i, arr) => {
                            const showDots = i > 0 && page - arr[i-1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showDots && <span className="px-2 text-zinc-400 text-xs">...</span>}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={cn(
                                    "w-8 h-8 text-[10px] font-bold rounded transition-all",
                                    currentPage === page ? "bg-black text-white" : "hover:bg-zinc-100 text-zinc-400"
                                  )}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })
                        }
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-zinc-200 bg-white rounded hover:bg-zinc-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* EDIT MODAL */}
        {editProduct && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl overflow-hidden">
              <div className="bg-black text-white p-6 flex justify-between items-center"><h3 className="font-bold uppercase tracking-widest text-sm">编辑商品</h3><button onClick={() => setEditProduct(null)}><X size={20} /></button></div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-bold uppercase text-zinc-400">商品名称</label><input type="text" value={editProduct.name || ''} onChange={(e) => setEditProduct((prev: any) => prev ? ({ ...prev, name: e.target.value }) : null)} className="w-full border-b border-zinc-200 py-2 outline-none font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">品牌</label><select value={editProduct.brandId || ''} onChange={(e) => setEditProduct((prev: any) => prev ? ({ ...prev, brandId: e.target.value }) : null)} className="w-full border-b border-zinc-200 py-2 outline-none bg-transparent">{data?.brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">类别</label><select value={editProduct.category || 'Necklaces'} onChange={(e) => setEditProduct((prev: any) => prev ? ({ ...prev, category: e.target.value }) : null)} className="w-full border-b border-zinc-200 py-2 outline-none bg-transparent">{CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Original (Official Price)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
                    <input type="text" value={editProduct.originalPrice?.replace('$', '') || ''} onChange={(e) => { const v = e.target.value; setEditProduct((prev: any) => prev ? ({ ...prev, originalPrice: v, salePrice: calculateSalePrice(v, prev.discount ?? -60) }) : null); }} className="w-full border-b border-zinc-200 py-2 pl-4 outline-none font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">折扣 (%)</label>
                    <span className="text-[10px] font-bold text-red-500">{(editProduct.discount || 0) > 0 ? '+' : ''}{(editProduct.discount || 0).toFixed(2)}%</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    max="100"
                    value={Math.abs(editProduct.discount || 0)} 
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const current = Math.abs(editProduct.discount || 0);
                        let next;
                        if (e.key === 'ArrowUp') {
                          next = Math.min(100, Math.floor(current / 1) * 1 + 1);
                        } else {
                          next = Math.max(0, Math.ceil(current / 1) * 1 - 1);
                        }
                        const d = -next;
                        setEditProduct((prev: any) => prev ? ({ ...prev, discount: d, salePrice: calculateSalePrice(prev.originalPrice, d) }) : null);
                      }
                    }}
                    onChange={(e) => { 
                      const d = -(Math.abs(parseFloat(e.target.value) || 0)); 
                      setEditProduct((prev: any) => prev ? ({ ...prev, discount: d, salePrice: calculateSalePrice(prev.originalPrice, d) }) : null); 
                    }} 
                    className="w-full border-b border-zinc-200 py-2 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Sale (Replica Price)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-red-600">$</span>
                    <input type="text" value={editProduct.salePrice?.replace('$', '') || ''} onChange={(e) => { const v = e.target.value; setEditProduct((prev: any) => prev ? ({ ...prev, salePrice: v, discount: calculateDiscount(prev.originalPrice, v) }) : null); }} className="w-full border-b border-zinc-200 py-2 pl-4 outline-none font-bold text-red-600" />
                  </div>
                </div>
                <MultiImageManager 
                  images={editProduct.images || []} 
                  onChange={(newImgs) => setEditProduct((prev: any) => prev ? ({ ...prev, images: newImgs }) : null)} 
                />
              </div>
              <div className="p-6 bg-zinc-50 flex justify-end"><button onClick={() => { setData((prev: any) => ({ ...prev, products: prev.products.map((p: any) => p.id === editProduct.id ? editProduct : p) })); setEditProduct(null); }} className="bg-black text-white font-bold text-[10px] px-10 py-3 uppercase tracking-widest">保存更新</button></div>
            </div>
          </div>
        )}

        {isAddingProduct && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl overflow-hidden">
              <div className="bg-black text-white p-6 flex justify-between items-center"><h3 className="font-bold uppercase tracking-widest text-sm">添加商品</h3><button onClick={() => setIsAddingProduct(false)}><X size={20} /></button></div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-bold uppercase text-zinc-400">名称</label><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full border-b border-zinc-200 py-2 outline-none font-bold" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">品牌</label><select value={newProduct.brandId} onChange={(e) => setNewProduct({ ...newProduct, brandId: e.target.value })} className="w-full border-b border-zinc-200 py-2 outline-none bg-transparent">{data?.brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-zinc-400">类别</label><select value={newProduct.category || 'Necklaces'} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full border-b border-zinc-200 py-2 outline-none bg-transparent">{CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Original (Official Price)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
                    <input type="text" value={newProduct.originalPrice?.replace('$', '')} onChange={(e) => { const v = e.target.value; const s = calculateSalePrice(v, newProduct.discount ?? -60); setNewProduct({ ...newProduct, originalPrice: v, salePrice: s }); }} className="w-full border-b border-zinc-200 py-2 pl-4 outline-none font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">折扣 (%)</label>
                    <span className="text-[10px] font-bold text-red-500">{newProduct.discount.toFixed(2)}%</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    min="1"
                    max="100"
                    value={Math.abs(newProduct.discount)} 
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const current = Math.abs(newProduct.discount);
                        let next;
                        if (e.key === 'ArrowUp') {
                          next = Math.min(100, Math.floor(current / 1) * 1 + 1);
                        } else {
                          next = Math.max(0, Math.ceil(current / 1) * 1 - 1);
                        }
                        const d = -next;
                        const s = calculateSalePrice(newProduct.originalPrice, d);
                        setNewProduct({ ...newProduct, discount: d, salePrice: s });
                      }
                    }}
                    onChange={(e) => { 
                      const d = -(Math.abs(parseFloat(e.target.value) || 0)); 
                      const s = calculateSalePrice(newProduct.originalPrice, d);
                      setNewProduct({ ...newProduct, discount: d, salePrice: s });
                    }} 
                    className="w-full border-b border-zinc-200 py-2 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Sale (Replica Price)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold text-red-600">$</span>
                    <input type="text" value={newProduct.salePrice?.replace('$', '')} onChange={(e) => { const v = e.target.value; const d = calculateDiscount(newProduct.originalPrice, v); setNewProduct({ ...newProduct, salePrice: v, discount: d }); }} className="w-full border-b border-zinc-200 py-2 pl-4 outline-none font-bold text-red-600" />
                  </div>
                </div>
                <MultiImageManager 
                  images={newProduct.images || []} 
                  onChange={(newImgs) => setNewProduct({ ...newProduct, images: newImgs })} 
                />
              </div>
              <div className="p-6 bg-zinc-50 flex justify-end"><button onClick={() => { const { discount, ...final } = newProduct; setData((prev: any) => ({ ...prev, products: [final, ...(prev.products || [])] })); setIsAddingProduct(false); }} className="bg-black text-white font-bold text-[10px] px-10 py-3 uppercase tracking-widest">确认添加</button></div>
            </div>
          </div>
        )}

        {importPreview && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tighter text-black">导入预览 (Ready to Import)</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">请确认商品信息，点击确认后将开始转存图片并加入库存</p>
                    {importProgress.currentIndex >= 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black transition-all duration-300" 
                            style={{ width: `${((importProgress.currentIndex + 1) / importPreview.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-black">
                          {Math.round(((importProgress.currentIndex + 1) / importPreview.length) * 100)}%
                        </span>
                        {importProgress.failedCount > 0 && (
                          <span className="text-[10px] font-black text-red-500 ml-2">
                            ({importProgress.failedCount} FAILURES)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setImportPreview(null)} className="text-zinc-400 hover:text-black"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">预览</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">名称</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">品牌</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">类目</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">官方价</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">复刻价 (15%)</th>
                       <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Action</th>
                       <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">状态</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-50">
                     {importPreview.map((p: any, i: number) => {
                       const isSavingThis = importProgress.currentIndex === i;
                       const isSaved = importProgress.savedIds.includes(p.id);
                       
                         return (
                           <tr key={i} className={cn("transition-colors", isSavingThis && "bg-zinc-50", isSaved && "opacity-60")}>
                             <td className="py-3">
                               <TableThumbnail images={p.images || []} />
                             </td>
                             <td className="py-3 text-xs font-bold text-black">{p.name}</td>
                           <td className="py-3 text-[10px] font-bold uppercase text-zinc-400">{p.brandId}</td>
                           <td className="py-3 text-[10px] font-bold uppercase text-zinc-400">{p.category}</td>
                           <td className="py-3 text-xs font-bold text-black">${p.originalPrice}</td>
                           <td className="py-3 text-xs font-bold text-red-600">${p.salePrice}</td>
                           <td className="py-3 text-right">
                             {!isSaved && !isSavingThis && (
                               <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => setEditImportIndex(i)}
                                   className="text-zinc-300 hover:text-black transition-colors p-1"
                                   title="编辑/手动上传图片"
                                 >
                                   <Edit3 size={14} />
                                 </button>
                                 <button 
                                   onClick={() => setImportPreview(prev => prev ? prev.filter((_, idx) => idx !== i) : null)}
                                   className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                                   title="从待导入列表中移除"
                                 >
                                   <X size={14} />
                                 </button>
                               </div>
                             )}
                           </td>
                           <td className="py-3 text-right">
                            {isSaved ? (
                              <div className="inline-flex items-center gap-1 text-green-600">
                                <Check size={12} />
                                <span className="text-[10px] font-bold uppercase">已保存</span>
                              </div>
                            ) : isSavingThis ? (
                              <div className="inline-flex items-center gap-1 text-black">
                                <Loader2 size={12} className="animate-spin" />
                                <span className="text-[10px] font-bold uppercase">正在保存...</span>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-4">
                <button 
                  onClick={() => setImportPreview(null)}
                  className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={confirmImport}
                  className="px-10 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  确认导入并转存图片 ({importPreview.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {editImportIndex !== null && importPreview && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold uppercase tracking-tighter">手动修复商品图片</h3>
                <button onClick={() => setEditImportIndex(null)} className="text-zinc-400 hover:text-black"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">商品名称</label>
                    <input type="text" value={importPreview[editImportIndex].name} onChange={(e) => {
                      const next = [...importPreview];
                      next[editImportIndex].name = e.target.value;
                      setImportPreview(next);
                    }} className="w-full border-b border-zinc-100 py-1 font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400">类目</label>
                    <input type="text" value={importPreview[editImportIndex].category} onChange={(e) => {
                      const next = [...importPreview];
                      next[editImportIndex].category = e.target.value;
                      setImportPreview(next);
                    }} className="w-full border-b border-zinc-100 py-1 font-bold text-sm" />
                  </div>
                </div>
                <MultiImageManager 
                  images={importPreview[editImportIndex].images || []} 
                  onChange={(newImgs) => {
                    const next = [...importPreview];
                    next[editImportIndex].images = newImgs;
                    setImportPreview(next);
                  }} 
                />
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setEditImportIndex(null)}
                    className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800"
                  >
                    确认修改 (保存后将跳过下载)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewerImages.length > 0 && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center overflow-hidden" onWheel={(e) => setViewerZoom(prev => Math.max(0.1, Math.min(5, prev + (e.deltaY > 0 ? -0.1 : 0.1))))}>
            <div className="absolute top-6 right-6 flex gap-4 z-10">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest self-center">SCALING: {(viewerZoom * 100).toFixed(0)}%</span>
              <button onClick={() => setViewerImages([])} className="bg-white/10 text-white p-2 rounded-full transition-all hover:bg-white/20"><X size={24} /></button>
            </div>

            {/* Carousel Controls */}
            {viewerImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(prev => (prev - 1 + viewerImages.length) % viewerImages.length); setViewerZoom(1); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 text-white p-4 rounded-full transition-all hover:bg-white/20 z-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(prev => (prev + 1) % viewerImages.length); setViewerZoom(1); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 text-white p-4 rounded-full transition-all hover:bg-white/20 z-10"
                >
                  <ChevronRight size={32} />
                </button>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {viewerImages.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setViewerIndex(i)}
                      className={cn("w-2 h-2 rounded-full transition-all", viewerIndex === i ? "bg-white w-6" : "bg-white/30")}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="w-full h-full flex items-center justify-center p-12 overflow-auto">
              <img 
                src={viewerImages[viewerIndex]} 
                alt="Preview" 
                style={{ transform: `scale(${viewerZoom})`, transition: 'transform 0.1s ease-out' }} 
                className="max-w-none shadow-2xl origin-center" 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
