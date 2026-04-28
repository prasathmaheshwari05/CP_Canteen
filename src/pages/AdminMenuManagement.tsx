import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ApiService from '@/api/apiServices';

const catColors: Record<string, string> = {
  Breakfast: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Lunch:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Dinner:    'bg-orange-500/15 text-orange-400 border-orange-500/25'
};

const catEmoji: Record<string, string> = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙'
};

export default function AdminMenuManagement() {
  const { } = useAppStore();
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [publishing, setPublishing]   = useState(false);

  useEffect(() => {
    ApiService.get('/api/menu')
      .then(res => setApiProducts(res.data ?? []))
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
      toast.success(`${selected.size} item${selected.size > 1 ? 's' : ''} published to today's menu!`);
    } catch (err) {
      toast.error(ApiService.handleAxiosError(err, 'Failed to publish menu'));
    } finally {
      setPublishing(false);
    }
  };

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
        <Button
          onClick={handlePublish}
          disabled={publishing || selected.size === 0}
          className="text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' }}
        >
          {publishing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
          ) : <Save className="w-4 h-4 mr-2" />}
          {publishing ? 'Publishing...' : 'Publish Menu'}
        </Button>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {apiProducts.map((p, i) => {
          const id: number = p.id;
          const isSelected = selected.has(id);
          const emoji = catEmoji[p.category] ?? '🍽️';

          return (
            <motion.div key={id} layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggleItem(id)}
              whileHover={{ scale: 1.02 }}
              className={`bg-card rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${
                isSelected ? 'border-orange-400/60 ring-2 ring-orange-400/20' : 'border-border/60'
              }`}
            >
              {/* Image */}
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

      {apiProducts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No menu items found.</p>
        </div>
      )}
    </div>
  );
}
