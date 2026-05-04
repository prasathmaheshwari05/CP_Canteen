import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
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

      {/* Header */}
      <div className="glass-strong p-4 rounded-2xl flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-orange-500">{selected.size}</span> / {apiProducts.length} items selected for today
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (selected.size === 0) {
              toast.warning('Please select at least one menu item to publish');
              return;
            }
            if (
              publishedSelection !== null &&
              selected.size === publishedSelection.size &&
              [...selected].every(id => publishedSelection.has(id))
            ) {
              toast.warning('This menu is already published. Please modify your selection before publishing again.');
              return;
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

      {/* Category-grouped product grid */}
      {apiProducts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No menu items found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCategories.map((category, groupIdx) => (
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
                    {grouped[category].length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-border/30" />
              </motion.div>

              {(() => {
                const showAll = showAllMap[category];
                const items = showAll ? grouped[category] : grouped[category].slice(0, SHOW_LIMIT);
                const hasMore = grouped[category].length > SHOW_LIMIT;
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      className={`bg-card rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${
                        isSelected ? 'border-orange-400/60 ring-2 ring-orange-400/20 bg-orange-500/5' : 'border-border/60'
                      }`}
                    >
                      <div className="h-36 bg-muted/40 flex items-center justify-center overflow-hidden">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <span className="text-6xl">{emoji}</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm leading-snug truncate">{p.name}</h4>
                          <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${catColors[p.category] ?? ''}`}>
                            {p.category}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{p.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-lg font-bold text-orange-500">₹{p.price}</p>
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={(e) => { e.stopPropagation(); toggleItem(id); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-orange-400 hover:text-orange-500'
                            }`}
                          >
                            {isSelected ? '✓ Available' : 'Available'}
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
                            : <><ChevronDown className="w-4 h-4" /> Show {grouped[category].length - SHOW_LIMIT} More Items</>
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
    </div>
  );
}
