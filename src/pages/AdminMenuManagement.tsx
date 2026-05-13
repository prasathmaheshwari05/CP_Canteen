import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Search, X, History, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ApiService from '@/api/apiServices';

const catColors: Record<string, string> = {
  Breakfast: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Lunch:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Dinner:    'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const catEmoji: Record<string, string> = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙',
};

const CAT_ORDER = ['Breakfast', 'Lunch', 'Dinner'];
const SHOW_LIMIT = 4;

export default function AdminMenuManagement() {
  const { } = useAppStore();
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [publishing, setPublishing]   = useState(false);
  const [publishedSelection, setPublishedSelection] = useState<Set<number> | null>(null);

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/menu'),
      ApiService.get('/api/today-menu'),
    ])
      .then(([menuRes, todayRes]) => {
        setApiProducts(
          (menuRes.data ?? []).map((p: any) => ({
            ...p,
            category:
              CAT_ORDER.find(
                (c) => c.toLowerCase() === (p.category ?? '').trim().toLowerCase()
              ) ?? (p.category ?? '').trim(),
          }))
        );
        const todayIds: number[] = (todayRes.data ?? []).map((item: any) => Number(item.id ?? item.menu_id ?? item));
        if (todayIds.length > 0) {
          const idSet = new Set(todayIds);
          setSelected(idSet);
          setPublishedSelection(idSet);
        }
      })
      .catch(() => toast.error('Failed to load menu items'))
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0) { toast.error('Select at least one item'); return; }
    setPublishing(true);
    try {
      await ApiService.post('/api/today-menu', { menu_ids: [...selected].map(Number) });
      setPublishedSelection(new Set(selected));
      toast.success(`${selected.size} item${selected.size > 1 ? 's' : ''} published to today's menu!`);
    } catch (err) {
      toast.error(ApiService.handleAxiosError(err, 'Failed to publish menu'));
    } finally {
      setPublishing(false);
    }
  };

  // Build sorted category groups
  const grouped = apiProducts.reduce<Record<string, any[]>>((acc, p) => {
    const cat = p.category || 'Uncategorized';
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CAT_ORDER.indexOf(a);
    const bi = CAT_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});
  const toggleShowAll = (cat: string) => setShowAllMap(prev => ({ ...prev, [cat]: !prev[cat] }));

  // ── Menu History ──
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);

  const fetchHistory = async (date: string) => {
    setHistoryLoading(true);
    setHistoryFetched(false);
    try {
      const [histRes, menuRes] = await Promise.all([
        ApiService.get('/api/today-menu/history', { selected_date: date }),
        ApiService.get('/api/menu'),
      ]);
      const ids: number[] = (histRes.data ?? []).map((item: any) => Number(item.id ?? item.menu_id ?? item));
      const allProducts: any[] = menuRes.data ?? [];
      const matched = ids.map(id => allProducts.find((p: any) => p.id === id)).filter(Boolean);
      setHistoryItems(matched);
    } catch {
      toast.error('Failed to load menu history');
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
      setHistoryFetched(true);
    }
  };

  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'added' | 'not-added'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  // Apply search + category + status filters across all products
  const getFilteredItems = (items: any[]) =>
    items.filter(p => {
      const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === 'all' ? true :
        filterStatus === 'added' ? selected.has(p.id) :
        !selected.has(p.id);
      return matchSearch && matchStatus;
    });

  const filteredGrouped = sortedCategories.reduce<Record<string, any[]>>((acc, cat) => {
    if (filterCat !== 'All' && cat !== filterCat) return acc;
    const items = getFilteredItems(grouped[cat] ?? []);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const filteredCategories = Object.keys(filteredGrouped).sort((a, b) => {
    const ai = CAT_ORDER.indexOf(a); const bi = CAT_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const totalFiltered = Object.values(filteredGrouped).reduce((s, arr) => s + arr.length, 0);
  const hasActiveFilter = search.trim() !== '' || filterCat !== 'All' || filterStatus !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            className="w-8 h-8 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
          <p className="text-sm text-muted-foreground">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header + Filter Card ── */}
      <div className="glass-strong rounded-2xl border border-border/40 px-4 py-3 flex items-center gap-3 flex-wrap">

        {/* Selected count badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 shrink-0">
          <span className="text-sm font-black text-orange-400">{selected.size}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/ {apiProducts.length} selected</span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 shrink-0" />

        {/* Search */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-background/60 border border-border/50 focus-within:border-orange-500/50 transition-colors" style={{ width: '220px' }}>
          <Search className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/40 text-foreground min-w-0"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSearch('')}
                className="w-3.5 h-3.5 rounded-full bg-muted-foreground/25 hover:bg-red-500/30 flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-2 h-2 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 shrink-0" />

        {/* Category chips */}
        <div className="flex items-center gap-1">
          {['All', ...CAT_ORDER].map(cat => {
            const active = filterCat === cat;
            const grad =
              cat === 'Breakfast' ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' :
              cat === 'Lunch'     ? 'linear-gradient(135deg,#10b981,#34d399)' :
              cat === 'Dinner'    ? 'linear-gradient(135deg,#f97316,#fb923c)' :
                                    'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))';
            return (
              <motion.button key={cat} whileTap={{ scale: 0.9 }} onClick={() => setFilterCat(cat)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all ${
                  active ? 'text-white border-transparent shadow-sm' : 'bg-transparent text-muted-foreground border-border/40 hover:text-foreground'
                }`}
                style={active ? { background: grad } : {}}
              >
                {cat !== 'All' ? `${catEmoji[cat]} ` : ''}{cat}
              </motion.button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border/50 shrink-0" />

        {/* Status toggle + clear */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border/40">
            {([['all','All'],['added','✓ On'],['not-added','Off']] as const).map(([key, label]) => (
              <motion.button key={key} whileTap={{ scale: 0.92 }} onClick={() => setFilterStatus(key)}
                className={`h-6 px-2 rounded-md text-[10px] font-bold transition-all ${
                  filterStatus === key
                    ? key === 'added'     ? 'bg-emerald-500 text-white shadow-sm'
                    : key === 'not-added' ? 'bg-slate-600 text-white shadow-sm'
                    :                       'bg-orange-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {hasActiveFilter && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={() => { setSearch(''); setFilterCat('All'); setFilterStatus('all'); }}
                className="h-6 w-6 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {/* History + Publish — pushed to right */}
        <div className="flex items-center gap-2 ml-auto">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowHistory(true); setHistoryFetched(false); setHistoryItems([]); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs text-violet-400 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Menu History
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (selected.size === 0) { toast.warning('Please select at least one menu item to publish'); return; }
              if (publishedSelection !== null && selected.size === publishedSelection.size && [...selected].every(id => publishedSelection.has(id))) {
                toast.warning('This menu is already published. Please modify your selection before publishing again.'); return;
              }
              handlePublish();
            }}
            disabled={publishing}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs text-orange-400 overflow-hidden group border border-orange-500/30 bg-orange-500/15 hover:bg-orange-500/20 hover:border-orange-500/40 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            style={{ boxShadow: '0 0 12px -4px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent pointer-events-none" />
            <span className="relative flex items-center justify-center shrink-0">
              {publishing ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-3.5 h-3.5 border-2 border-orange-400/30 border-t-orange-400 rounded-full block" />
              ) : (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <Send className="relative w-3.5 h-3.5" />
                </>
              )}
            </span>
            {publishing ? 'Publishing...' : 'Publish Menu'}
          </motion.button>
        </div>
      </div>

      {/* ── Category-grouped product grid ── */}
      {apiProducts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No menu items found.</p>
        </div>
      ) : totalFiltered === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-14 rounded-2xl border border-border/40 bg-muted/10">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-muted-foreground">No items match your filters</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or category</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category, groupIdx) => (
            <div key={category}>

              {/* Category Badge */}
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIdx * 0.08, type: 'spring', stiffness: 300, damping: 26 }}
                className="flex items-center gap-2.5 mb-4"
              >
                <div className="flex-1 h-px bg-border/30" />
                <div className="relative flex items-center gap-2 px-3 py-1 rounded-lg overflow-hidden border border-border bg-muted/40">
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg,transparent 30%,hsl(var(--primary)/0.08) 50%,transparent 70%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
                  />
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-sm"
                  >
                    {catEmoji[category] || '🍽️'}
                  </motion.span>
                  <span className="text-xs font-bold tracking-widest uppercase text-foreground">
                    {category}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {filteredGrouped[category]?.length ?? 0}
                  </span>
                </div>
                <div className="flex-1 h-px bg-border/30" />
              </motion.div>

              {(() => {
                const showAll = showAllMap[category];
                const allFiltered = filteredGrouped[category] ?? [];
                const items = showAll ? allFiltered : allFiltered.slice(0, SHOW_LIMIT);
                const hasMore = allFiltered.length > SHOW_LIMIT;
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {items.map((p, i) => {
                  const id: number = p.id;
                  const isSelected = selected.has(id);
                  const emoji = catEmoji[p.category] ?? '🍽️';
                  return (
                    <motion.div key={id} layout
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIdx * 0.08 + i * 0.04 }}
                      onClick={() => toggleItem(id)}
                      whileHover={{ scale: 1.02 }}
                      className={`bg-card rounded-xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${
                        isSelected ? 'border-orange-400/60 ring-2 ring-orange-400/20 bg-orange-500/5' : 'border-border/60'
                      }`}
                    >
                      <div className="h-24 bg-muted/40 flex items-center justify-center overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-4xl">{emoji}</span>}
                      </div>
                      <div className="p-2.5">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-xs leading-snug truncate">{p.name}</h4>
                          <Badge variant="outline" className={`text-[9px] font-semibold shrink-0 px-1.5 py-0 ${catColors[p.category] ?? ''}`}>
                            {p.category}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{p.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-sm font-bold text-orange-500">₹{p.price}</p>
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={(e) => { e.stopPropagation(); toggleItem(id); }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-orange-400 hover:text-orange-500'
                            }`}
                          >
                            {isSelected ? '✓ Added' : 'Add'}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                      })}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center pt-3">
                        <button
                          onClick={() => toggleShowAll(category)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-border/60 bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {showAll
                            ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                            : <><ChevronDown className="w-4 h-4" /> Show {allFiltered.length - SHOW_LIMIT} More Items</>
                          }
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* ── Menu History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <History className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Menu History</p>
                    <p className="text-xs text-muted-foreground">View published menu by date</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)}
                  className="w-7 h-7 rounded-lg bg-muted/40 hover:bg-muted/70 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Date picker */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background/60 focus-within:border-violet-500/50 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="date"
                    value={historyDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => { setHistoryDate(e.target.value); setHistoryFetched(false); setHistoryItems([]); }}
                    className="bg-transparent text-sm outline-none text-foreground"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                  onClick={() => fetchHistory(historyDate)}
                  disabled={historyLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                >
                  {historyLoading
                    ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full block" />
                    : <History className="w-3.5 h-3.5" />}
                  {historyLoading ? 'Loading...' : 'View'}
                </motion.button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {!historyFetched && !historyLoading && (
                  <p className="text-sm text-muted-foreground text-center py-10">Select a date and click View</p>
                )}
                {historyLoading && (
                  <div className="flex justify-center py-10">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full" />
                  </div>
                )}
                {historyFetched && !historyLoading && historyItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">No menu was published on this date.</p>
                )}
                {historyFetched && !historyLoading && historyItems.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">
                      <span className="font-semibold text-violet-400">{historyItems.length} item{historyItems.length > 1 ? 's' : ''}</span>{' '}published on{' '}
                      <span className="font-semibold text-foreground">
                        {new Date(historyDate + 'T00:00:00').toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {historyItems.map((p, i) => (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                          <div className="h-24 bg-muted/40 flex items-center justify-center overflow-hidden">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              : <span className="text-3xl">{catEmoji[p.category] ?? '🍽️'}</span>}
                          </div>
                          <div className="p-2.5">
                            <p className="font-bold text-xs truncate mb-1.5">{p.name}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`text-[9px] font-semibold px-1.5 py-0 ${catColors[p.category] ?? ''}`}>
                                {p.category}
                              </Badge>
                              <span className="text-xs font-bold text-orange-400">₹{p.price}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
