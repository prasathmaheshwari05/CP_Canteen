import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Search, ImagePlus, X, Upload,
  Package, ChevronDown, Sparkles, ChevronUp,
} from 'lucide-react';
import { useAppStore, Product } from '@/store/appStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ApiService from '@/api/apiServices';

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages'] as const;

const catMeta: Record<string, { pill: string; bar: string; emoji: string; bg: string }> = {
  Breakfast: { pill: 'bg-amber-100 text-amber-600 border-amber-200',    bar: 'bg-amber-400',   emoji: '🌅', bg: 'bg-amber-50' },
  Lunch:     { pill: 'bg-emerald-100 text-emerald-600 border-emerald-200', bar: 'bg-emerald-400', emoji: '☀️', bg: 'bg-emerald-50' },
  Dinner:    { pill: 'bg-violet-100 text-violet-600 border-violet-200',  bar: 'bg-violet-400',  emoji: '🌙', bg: 'bg-violet-50' },
  Snacks:    { pill: 'bg-rose-100 text-rose-600 border-rose-200',        bar: 'bg-rose-400',    emoji: '🍿', bg: 'bg-rose-50' },
  Beverages: { pill: 'bg-sky-100 text-sky-600 border-sky-200',           bar: 'bg-sky-400',     emoji: '☕', bg: 'bg-sky-50' },
};

const emptyForm = { name: '', price: '', category: '' as Product['category'], available: true, description: '' };
const emptyErrors = { name: '', price: '', category: '', description: '', image: '' };

const SHOW_LIMIT = 6;

export default function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct } = useAppStore();
  const [apiProducts, setApiProducts]   = useState<Product[]>([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('All');
  const [editing, setEditing]           = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [errors, setErrors]             = useState(emptyErrors);
  const [showAll, setShowAll]           = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const formRef                         = useRef<HTMLDivElement>(null);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/api/menu');
      const data: any[] = res.data;
      const mapped: Product[] = data.map(item => ({
        id: String(item.id),
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available,
        images: item.images ?? [],
        description: item.description ?? '',
      }));
      setApiProducts(mapped);
    } catch {
      // fallback to local store products if API unavailable
      setApiProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenuItems(); }, [fetchMenuItems]);

  // Use API products if available, else fall back to local store
  const allProducts = apiProducts.length > 0 ? apiProducts : products;

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterCat === 'All' || p.category === filterCat)
  );

  const displayed = showAll ? filtered : filtered.slice(0, SHOW_LIMIT);
  const hasMore   = filtered.length > SHOW_LIMIT;

  // ── Validation ──
  const validate = () => {
    const e = { name: '', price: '', category: '', description: '', image: '' };
    let valid = true;

    // Name: required, min 2, max 50, letters/spaces/special chars only
    if (!form.name.trim())
      { e.name = 'Product name is required'; valid = false; }
    else if (form.name.trim().length < 2)
      { e.name = 'Name must be at least 2 characters'; valid = false; }
    else if (form.name.trim().length > 50)
      { e.name = 'Name cannot exceed 50 characters'; valid = false; }
    else if (!/^[a-zA-Z0-9\s\-&'.()]+$/.test(form.name.trim()))
      { e.name = 'Name contains invalid characters'; valid = false; }

    // Price: required, numeric, > 0, max 10000, max 2 decimals
    if (!form.price)
      { e.price = 'Price is required'; valid = false; }
    else if (isNaN(Number(form.price)))
      { e.price = 'Price must be a valid number'; valid = false; }
    else if (Number(form.price) <= 0)
      { e.price = 'Price must be greater than ₹0'; valid = false; }
    else if (Number(form.price) > 10000)
      { e.price = 'Price cannot exceed ₹10,000'; valid = false; }
    else if (!/^\d+(\.\d{1,2})?$/.test(form.price))
      { e.price = 'Max 2 decimal places allowed'; valid = false; }

    // Category: required (must select one)
    if (!form.category)
      { e.category = 'Please select a category'; valid = false; }

    // Description: required, min 5, max 200
    if (!form.description.trim())
      { e.description = 'Description is required'; valid = false; }
    else if (form.description.trim().length < 5)
      { e.description = 'Description must be at least 5 characters'; valid = false; }
    else if (form.description.trim().length > 200)
      { e.description = 'Description cannot exceed 200 characters'; valid = false; }

    // Image: required
    if (!imagePreview)
      { e.image = 'Product image is required'; valid = false; }

    setErrors(e);
    return valid;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    toast.success('Image uploaded!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      available: form.available,
      images: imagePreview ? [imagePreview] : [],
      description: form.description.trim(),
    };

    if (editing) {
      try {
        await ApiService.put(`/api/menu/${editing.id}`, payload);
        updateProduct(editing.id, payload);
        toast.success('Product updated!');
        await fetchMenuItems(); // refresh list from API
      } catch (err) {
        const msg = ApiService.handleAxiosError(err, 'Failed to update product');
        toast.error(msg);
        return;
      }
      setEditing(null);
    } else {
      try {
        const res = await ApiService.post('/api/menu', payload);
        const data = res.data;
        addProduct({
          id: String(data.id),
          name: data.name,
          price: data.price,
          category: data.category,
          available: data.available,
          images: data.images ?? [],
          description: data.description ?? '',
        });
        toast.success('Product added successfully!');
        await fetchMenuItems(); // refresh list from API
      } catch (err) {
        const msg = ApiService.handleAxiosError(err, 'Failed to add product');
        toast.error(msg);
        return;
      }
    }

    setForm(emptyForm);
    setErrors(emptyErrors);
    setImagePreview(null);
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setErrors({ name: '', price: '', category: '', description: '', image: '' });
    setForm({ name: p.name, price: p.price.toString(), category: p.category, available: p.available, description: p.description || '' });
    setImagePreview(p.images?.[0] || null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => { setEditing(null); setForm(emptyForm); setErrors({ name: '', price: '', category: '', description: '', image: '' }); setImagePreview(null); };

  const setField = (key: keyof typeof form, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: '' }));
  };

  return (
    <div className="space-y-8">

      {/* ── Form ── */}
      <motion.div ref={formRef} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl border overflow-hidden"
        style={{ borderColor: editing ? 'hsl(262 83% 58% / 0.3)' : 'hsl(24 95% 53% / 0.2)' }}>
        <div className="h-1 w-full" style={{ background: editing
          ? 'linear-gradient(90deg,hsl(262 83% 58%),hsl(291 64% 42%))'
          : 'linear-gradient(90deg,hsl(24 95% 53%),hsl(43 96% 52%))' }} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: editing ? 'linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))' : 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' }}>
                {editing ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h3 className="text-sm font-bold">{editing ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-[10px] text-muted-foreground">{editing ? 'Update product details below' : 'Fill in the details to add a new item'}</p>
              </div>
            </div>
            {editing && (
              <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/50">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

              {/* Image */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Image *</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div onClick={() => { fileInputRef.current?.click(); setErrors(er => ({ ...er, image: '' })); }}
                  className={`relative h-[168px] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                    errors.image ? 'border-red-500/60 bg-red-500/5' : 'border-border hover:border-orange-500/40 bg-muted/20 hover:bg-orange-500/5'
                  }`}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <Upload className="w-5 h-5 text-white" />
                        <span className="text-white text-[10px] font-medium">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-3">
                      <ImagePlus className={`w-8 h-8 mx-auto mb-2 transition-colors ${errors.image ? 'text-red-400' : 'text-muted-foreground group-hover:text-orange-400'}`} />
                      <p className={`text-xs ${errors.image ? 'text-red-400' : 'text-muted-foreground'}`}>Click to upload</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
                {errors.image && <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{errors.image}</p>}
                {imagePreview && (
                  <button type="button" onClick={() => { setImagePreview(null); setErrors(er => ({ ...er, image: '' })); }}
                    className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" /> Remove image
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name *</label>
                  <Input placeholder="e.g. Masala Dosa" value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    className={`h-10 bg-muted/30 text-sm transition-colors ${errors.name ? 'border-red-500/60 focus:border-red-500' : 'border-border/60 focus:border-orange-500/50'}`} />
                  {errors.name && <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (₹) *</label>
                  <Input type="number" placeholder="50" value={form.price}
                    onChange={e => setField('price', e.target.value)}
                    className={`h-10 bg-muted/30 text-sm transition-colors ${errors.price ? 'border-red-500/60 focus:border-red-500' : 'border-border/60 focus:border-orange-500/50'}`} />
                  {errors.price && <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{errors.price}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category *</label>
                  <div className="relative">
                    <select value={form.category}
                      onChange={e => setField('category', e.target.value)}
                      className={`w-full h-10 bg-muted/30 border rounded-lg px-3 pr-8 text-sm outline-none transition-colors appearance-none ${
                        errors.category ? 'border-red-500/60 text-muted-foreground' : 'border-border/60 text-foreground focus:border-orange-500/50'
                      }`}>
                      <option value="" disabled>Select a category</option>
                      {categories.map(c => <option key={c} value={c}>{catMeta[c].emoji} {c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.category && <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{errors.category}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Availability</label>
                  <div className="flex items-center justify-between h-10 px-3 bg-muted/30 border border-border/60 rounded-lg">
                    <span className="text-sm text-muted-foreground">{form.available ? 'Available' : 'Unavailable'}</span>
                    <Switch checked={form.available} onCheckedChange={v => setField('available', v)} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Description * <span className="normal-case font-normal text-muted-foreground/60">({form.description.length}/200)</span>
                  </label>
                  <textarea placeholder="Brief description of this item (min 5 characters)..." value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    className={`w-full min-h-[72px] rounded-lg bg-muted/30 border px-3 py-2 text-sm outline-none transition-colors resize-none ${errors.description ? 'border-red-500/60 focus:border-red-500' : 'border-border/60 focus:border-orange-500/50'}`} />
                  {errors.description && <p className="text-[10px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{errors.description}</p>}
                </div>

                <div className="md:col-span-2 flex justify-end pt-1">
                  <Button type="submit" className="h-10 px-8 text-white font-semibold text-sm shadow-lg"
                    style={{ background: editing ? 'linear-gradient(135deg,hsl(262 83% 58%),hsl(291 64% 42%))' : 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' }}>
                    {editing
                      ? <><Pencil className="w-4 h-4 mr-2" />Update Product</>
                      : <><Sparkles className="w-4 h-4 mr-2" />Add Product</>}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setShowAll(false); }}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...categories].map(c => (
            <button key={c} onClick={() => { setFilterCat(c); setShowAll(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterCat === c ? 'text-white border-transparent shadow-md' : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border/50'
              }`}
              style={filterCat === c ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' } : {}}>
              {c !== 'All' ? `${catMeta[c].emoji} ` : ''}{c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-4">
        {loading
          ? <span className="text-orange-400 animate-pulse">Loading menu items...</span>
          : <><span className="font-semibold text-foreground">{displayed.length}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> products</>
        }
      </p>

      {/* ── Product Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {displayed.map((p, i) => {
            const meta = catMeta[p.category];
            return (
              <motion.div key={p.id} layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                {/* Image area */}
                <div className="h-36 bg-muted/40 flex items-center justify-center overflow-hidden">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    : <span className="text-6xl">{meta?.emoji}</span>
                  }
                </div>

                <div className="p-4">
                  {/* Name + category */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm leading-snug">{p.name}</h4>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta?.pill}`}>
                      {p.category}
                    </span>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{p.description}</p>
                  )}

                  {/* Price + actions */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-orange-500">₹{p.price}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 transition-colors">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={async () => {
                          try {
                            await ApiService.delete(`/api/menu/${p.id}`);
                            deleteProduct(p.id);
                            await fetchMenuItems();
                            toast.success('Product deleted!');
                          } catch (err) {
                            const msg = ApiService.handleAxiosError(err, 'Failed to delete product');
                            toast.error(msg);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Show More / Less ── */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-border/60 bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all">
            {showAll
              ? <><ChevronUp className="w-4 h-4" /> Show Less</>
              : <><ChevronDown className="w-4 h-4" /> Show {filtered.length - SHOW_LIMIT} More Items</>
            }
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-16 text-center border border-border/40">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-muted-foreground">No products found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter</p>
        </motion.div>
      )}
    </div>
  );
}
