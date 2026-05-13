import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import ApiService from "@/api/apiServices";
import { useNavigate } from "react-router-dom";

const catEmojis: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
};
const CAT_ORDER = ["Breakfast", "Lunch", "Dinner"];
const SHOW_LIMIT = 8;

// Returns true if ordering is closed for this category based on current time
function isCategoryDisabled(category: string): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  const cat = category.toLowerCase();
  if (cat === 'dinner') return mins > 16 * 60;      // after 4:00 PM
  if (cat === 'lunch')  return mins > 22 * 60;      // after 10:00 PM
  return false;
}

function getCutoffLabel(category: string): string {
  const cat = category.toLowerCase();
  if (cat === 'dinner') return 'Ordering closed after 4:00 PM';
  if (cat === 'lunch')  return 'Ordering closed after 10:00 PM';
  return '';
}

const dashboardVideos = [
  { src: "/dashboardVideos/video1.mp4" },
  { src: "/dashboardVideos/video2.mp4" },
];
function AnimatedPrice({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 300, damping: 30 });
  const display = useTransform(spring, (v) => `₹${Math.round(v)}`);
  spring.set(value);
  return <motion.span>{display}</motion.span>;
}

function MyOrdersCard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/my-orders'),
      ApiService.get('/api/menu'),
    ]).then(([oRes, mRes]) => {
      setOrders(oRes.data ?? []);
      setMenu(mRes.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getMenuName = (menuId: number) =>
    menu.find(m => (m.menu_id ?? m.id) === menuId)?.name ?? `Item #${menuId}`;

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-orange-400" />
        </div>
        <p className="text-sm font-bold">My Orders</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-xs text-muted-foreground">
                <th className="text-left px-5 py-3 font-semibold">Order ID</th>
                <th className="text-left px-5 py-3 font-semibold">Items</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <motion.tr key={order.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-orange-400">#{order.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {order.items?.map((it: any) => `${getMenuName(it.menu_id)} ×${it.quantity}`).join(', ')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      order.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : order.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold">₹{order.total_amount}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const catColors: Record<string, { border: string; badge: string; hint: string; hintColor: string }> = {
  Breakfast: { border: 'border-amber-400/20',  badge: 'bg-amber-500/10 border-amber-400/30 text-amber-300',   hint: '🌙 Pre-book before 10:00 PM today — get your lunch delivered tomorrow!', hintColor: 'text-emerald-400' },
  Lunch:     { border: 'border-sky-400/20', badge: 'bg-sky-500/10 border-sky-400/30 text-sky-400', hint: '🌙 Pre-book before 10:00 PM today — get your lunch delivered tomorrow!', hintColor: 'text-orange-400' },
  Dinner:    { border: 'border-violet-400/20',  badge: 'bg-violet-500/10 border-violet-400/30 text-violet-400',   hint: '☀️ Book before 4:00 PM to secure your plate tonight!', hintColor: 'text-orange-400' },
};

function SkeletonRow() {
  return (
    <div className="space-y-4">
      {/* Category badge skeleton */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-px bg-border/30" />
        <div className="h-6 w-24 rounded-lg bg-muted/60 animate-pulse" />
        <div className="flex-1 h-px bg-border/30" />
      </div>
      {/* Cards skeleton row */}
      <div className="flex gap-4 pt-10 px-2 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative shrink-0 w-[160px] min-h-[190px] rounded-3xl border border-border/40 bg-muted/30 overflow-hidden"
          >
            {/* Floating image circle skeleton */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-muted/60 animate-pulse border-4 border-background" />
            <div className="pt-14 px-3.5 pb-3.5 space-y-2">
              <div className="h-3.5 w-3/4 mx-auto rounded-md bg-muted/60 animate-pulse" />
              <div className="h-2.5 w-1/2 mx-auto rounded-md bg-muted/40 animate-pulse" />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-4 w-10 rounded-md bg-muted/60 animate-pulse" />
                <div className="h-8 w-8 rounded-xl bg-muted/60 animate-pulse" />
              </div>
            </div>
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.07) 50%,transparent 70%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({ category, groupIdx, grouped, cart, cartMealType, canAddToCart, addToCart, updateCartQty, clearCategoryCart }: {
  category: string; groupIdx: number; grouped: Record<string, any[]>;
  cart: any[]; cartMealType: string | null;
  canAddToCart: (cat: string) => boolean;
  addToCart: (p: any) => void; updateCartQty: (id: string, qty: number) => void;
  clearCategoryCart: (cat: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const allItems = grouped[category] ?? [];
  const colors = catColors[category] ?? { border: 'border-border/30', badge: 'bg-muted/40 border-border text-foreground', hint: '', hintColor: '' };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [allItems]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  const categoryInCart = cart.some(c => (c.product.category ?? '').toLowerCase() === category.toLowerCase());

  return (
    <div>
      {/* Header row: badge + clear button */}
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: groupIdx * 0.08, type: 'spring', stiffness: 300, damping: 26 }}
        className="flex items-center gap-2.5 mb-4 mt-2"
      >
        <div className="flex-1 h-px bg-border/30" />
        <div className={`relative flex items-center gap-2 px-3 py-1 rounded-lg overflow-hidden border ${colors.badge}`}>
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.06) 50%,transparent 70%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />
          <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} className="text-sm">
            {catEmojis[category] || '🍽️'}
          </motion.span>
          <span className="text-xs font-bold tracking-widest uppercase">{category}</span>
          <span className="text-[10px] font-medium opacity-60">{allItems.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/30" />
      </motion.div>
      {/* Clear button — top right corner */}
      <div className="relative">
        <AnimatePresence>
          {categoryInCart && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 8 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => clearCategoryCart(category)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <X className="w-3 h-3" /> Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Hint banner */}
      {colors.hint && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 24 }}
          className={`text-xs font-extrabold text-center tracking-tight mb-4 ${colors.hintColor}`}>
          {colors.hint}
        </motion.p>
      )}

      {/* Closed banner */}
      {isCategoryDisabled(category) && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl border border-red-500/25 bg-red-500/10">
          <span className="text-sm">🔒</span>
          <span className="text-xs font-bold text-red-400">{getCutoffLabel(category)}</span>
        </motion.div>
      )}

      {/* Horizontal scroll row with side arrows */}
      <div className="relative">
        {/* Left arrow — vertically centered over cards */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm"
              style={{ background: 'linear-gradient(135deg,rgba(30,30,40,0.92),rgba(20,20,30,0.88))', boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right arrow — vertically centered over cards */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm"
              style={{ background: 'linear-gradient(135deg,rgba(30,30,40,0.92),rgba(20,20,30,0.88))', boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 pt-12 px-2 mx-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {allItems.map((p, i) => {
            const pid = String(p.menu_id ?? p.id);
            const inCart = cart.find((c) => c.product.id === pid);
            const disabled = isCategoryDisabled(category);
            const cartProduct = { id: pid, name: p.name, price: p.price, category: p.category, available: p.available, images: p.images ?? [], description: p.description ?? '' };
            return (
              <motion.div key={pid}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 22 }}
                whileHover={disabled ? {} : { y: -6, scale: 1.02 }}
                className={`group relative rounded-3xl flex flex-col items-center pt-12 px-3.5 pb-3.5 border shrink-0 w-[170px] min-h-[160px] ${
                  disabled
                    ? 'border-slate-300/30 dark:border-slate-700/40 opacity-60'
                    : inCart
                    ? 'border-cyan-400/70 shadow-[0_14px_34px_rgba(14,165,233,0.28)]'
                    : 'border-slate-300/50 dark:border-slate-700/70 shadow-[0_8px_20px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_24px_rgba(2,6,23,0.5)]'
                } bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950`}
              >
                {/* Disabled overlay */}
                {disabled && (
                  <div className="absolute inset-0 rounded-3xl z-10 flex flex-col items-center justify-center gap-1 bg-background/60 backdrop-blur-[2px]">
                    <span className="text-lg">🔒</span>
                    <span className="text-[10px] font-semibold text-muted-foreground text-center px-2 leading-tight">
                      {getCutoffLabel(category)}
                    </span>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(130deg,rgba(56,189,248,0.08),transparent 45%,rgba(249,115,22,0.1))' }} />

                {/* Floating image */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-slate-900"
                  style={{ boxShadow: '0 10px 24px rgba(15,23,42,0.26)' }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ background: '#f5f5f5' }}>{catEmojis[p.category] || '🍽️'}</div>
                  }
                </div>

                <p className="text-sm font-extrabold text-center leading-snug mb-1 w-full px-1 text-slate-900 dark:text-slate-100"
                  style={{ wordBreak: 'break-word', fontFamily: "'Playfair Display','Georgia',serif", letterSpacing: '0.02em' }}>
                  {p.name}
                </p>
                <p className="text-[10px] text-center mb-2 text-slate-500 dark:text-slate-400">{p.category}</p>

                {!inCart ? (
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2 w-full mt-auto">
                    <p className="text-sm font-black leading-none text-slate-900 dark:text-slate-100 truncate">₹{p.price}</p>
                    <motion.button whileTap={disabled ? {} : { scale: 0.85 }}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        if (!canAddToCart(p.category)) {
                          const other = cartMealType === 'lunch' ? 'Dinner' : 'Lunch';
                          toast.warning(`Remove your ${cartMealType === 'lunch' ? 'Lunch' : 'Dinner'} items before adding ${other}.`);
                          return;
                        }
                        addToCart(cartProduct);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black shadow-[0_7px_16px_rgba(14,165,233,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg,rgba(249,115,22,1),rgba(56,189,248,1))' }}>
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="w-full mt-auto space-y-1.5">
                    <p className="text-sm font-black leading-none text-slate-900 dark:text-slate-100">₹{p.price}</p>
                    <div className="flex items-center gap-1 rounded-xl border border-cyan-200/80 dark:border-cyan-800/60 bg-cyan-50/80 dark:bg-cyan-950/40 px-1.5 py-1 w-full justify-between">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateCartQty(pid, inCart.quantity - 1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center font-black bg-white/90 dark:bg-slate-900/70 text-cyan-700 dark:text-cyan-300"
                        style={{ boxShadow: '0 3px 10px rgba(14,165,233,0.2)' }}>
                        <Minus className="w-3.5 h-3.5" strokeWidth={2.8} />
                      </motion.button>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 w-5 text-center">{inCart.quantity}</span>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => addToCart(cartProduct)}
                        className="w-6 h-6 rounded-md flex items-center justify-center font-black bg-white/90 dark:bg-slate-900/70 text-cyan-700 dark:text-cyan-300"
                        style={{ boxShadow: '0 3px 10px rgba(14,165,233,0.2)' }}>
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { addToCart, updateCartQty, cart, addMyOrder } = useAppStore();
  const navigate = useNavigate();
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeVideo, setActiveVideo] = useState(0);
  const [showBill, setShowBill] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderData, setOrderData] = useState<{
    id: number;
    total_amount: number;
  } | null>(null);
  const [orderId] = useState(
    () => "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
  );
  const billRef = useRef<HTMLDivElement>(null);

  // Fetch today's menu from GET /api/today-menu
  const fetchTodayMenu = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setMenuLoading(true);
    try {
      const [todayRes, menuRes] = await Promise.all([
        ApiService.get("/api/today-menu"),
        ApiService.get("/api/menu"),
      ]);
      const todayItems: any[] = todayRes.data ?? [];
      const allProducts: any[] = menuRes.data ?? [];
      const merged = todayItems.map((item: any) => {
        const full = allProducts.find((p: any) => p.id === item.menu_id);
        return { ...item, category: full?.category ?? "" };
      });
      setMenuProducts(merged);
      if (isRefresh) toast.error('Failed to refresh menu');
    } finally {
      isRefresh ? setRefreshing(false) : setMenuLoading(false);
    }
  };

  useEffect(() => { fetchTodayMenu(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % dashboardVideos.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const cartMealType = (() => {
    const cats = cart.map(c => (c.product.category ?? '').toLowerCase());
    if (cats.some(c => c === 'lunch')) return 'lunch';
    if (cats.some(c => c === 'dinner')) return 'dinner';
    return null;
  })();

  const canAddToCart = (category: string) => {
    const cat = (category ?? '').toLowerCase();
    if (cat !== 'lunch' && cat !== 'dinner') return true;
    if (!cartMealType) return true;
    if (cartMealType === cat) return true;
    return false;
  };

  const clearCategoryCart = (category: string) => {
    const cat = category.toLowerCase();
    menuProducts
      .filter(p => (p.category ?? '').toLowerCase() === cat)
      .forEach(p => updateCartQty(String(p.menu_id ?? p.id), 0));
    toast.success(`${category} items cleared`);
  };

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  const grouped = menuProducts.reduce<Record<string, any[]>>((acc, p) => {
    const raw = (p.category ?? "").trim();
    const cat = CAT_ORDER.find(c => c.toLowerCase() === raw.toLowerCase()) || raw || "Other";
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {});
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CAT_ORDER.indexOf(a);
    const bi = CAT_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const handleViewBill = () => {
    setShowBill(true);
    setTimeout(
      () =>
        billRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      80,
    );
  };

  const handleCheckout = async () => {
    setConfirmed(false);
    setOrderData(null);
    setShowCheckout(true);
    try {
      const items = cart.map((c) => ({
        menu_id: Number(c.product.id),
        quantity: c.quantity,
      }));
      const res = await ApiService.post("/api/order", { items });
      setOrderData({ id: res.data.id, total_amount: res.data.total_amount });
      // Save to local store for MyBooking
      addMyOrder({
        id: res.data.id,
        total_amount: res.data.total_amount,
        created_at: new Date().toISOString(),
        items: cart.map((c) => ({
          menu_id: Number(c.product.id),
          quantity: c.quantity,
          name: c.product.name,
        })),
      });
      setConfirmed(true);
    } catch (err: any) {
      const msg = ApiService.handleAxiosError(err, "Order failed");
      toast.error(msg);
      setShowCheckout(false);
    }
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setConfirmed(false);
    menuProducts.forEach((p) => updateCartQty(String(p.menu_id ?? p.id), 0));
    setShowBill(false);
    navigate('/my-booking');
  };

  return (
    <div className="flex flex-col gap-4 p-2 pb-8">
      {/* Video Hero */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="relative w-full h-[38vh] min-h-[200px] max-h-[300px] sm:h-[50vh] sm:min-h-[300px] sm:max-h-[460px] md:h-[56vh] md:min-h-[380px] md:max-h-[620px]">
          <AnimatePresence mode="wait">
            <motion.video
              key={dashboardVideos[activeVideo].src}
              src={dashboardVideos[activeVideo].src}
              autoPlay
              muted
              loop
              playsInline
              initial={{ opacity: 0.15, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full object-cover outline-none"
            />
          </AnimatePresence>

    <div className="absolute inset-0 bg-black/40" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
          <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-5 md:p-6">
            <div className="flex flex-1 items-center">
              <div className="max-w-xs sm:max-w-md md:max-w-lg">
                <motion.p
                  key={dashboardVideos[activeVideo].src}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-base font-bold tracking-tight text-white drop-shadow-md sm:text-2xl md:text-3xl lg:text-[2.4rem]"
                  style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
                >
                  <span className="block mb-1 sm:mb-2">it’s not just</span>
                  <span className="block mb-1 sm:mb-2">Food, It’s an</span>
                  <span className="block">Experience.</span>
                </motion.p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5 sm:gap-2">
                {dashboardVideos.map((video, index) => (
                  <button
                    key={video.src}
                    type="button"
                    onClick={() => setActiveVideo(index)}
                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                      activeVideo === index
                        ? "w-7 sm:w-9 bg-orange-400"
                        : "w-2 sm:w-2.5 bg-white/55 hover:bg-white/90"
                    } focus:outline-none focus-visible:outline-none focus-visible:ring-0`}
                    aria-label={`Show clip ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Menu Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative rounded-3xl overflow-hidden p-5 sm:p-6 flex items-center justify-between gap-4 border border-cyan-300/25 bg-slate-950/70"
        style={{
          background:
            "radial-gradient(circle at 0% 0%,rgba(14,116,144,0.28),transparent 45%),radial-gradient(circle at 100% 100%,rgba(249,115,22,0.2),transparent 40%),linear-gradient(130deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.12) 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-cyan-200/30"
            style={{
              background:
                "linear-gradient(145deg,rgba(249,115,22,0.95),rgba(56,189,248,0.9))",
              boxShadow: "0 8px 22px rgba(14,165,233,0.35)",
            }}
          >
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-xl"
            >
              🍽️
            </motion.span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-white sm:text-base">
              Today's Food Reservation
            </p>
            <p className="text-xs text-slate-300 sm:text-sm">
              Browse the menu and add items to your cart!
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {/* Refresh button */}
          <motion.button
            onClick={() => fetchTodayMenu(true)}
            disabled={refreshing}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-cyan-300/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh menu"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0.3 }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
            </motion.div>
          </motion.button>
          {/* Live Menu badge */}
          <div className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-100">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live Menu
          </div>
        </div>
      </motion.div>

      {/* Menu Grid */}
      {menuLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="w-7 h-7 border-2 border-orange-400/30 border-t-orange-400 rounded-full"
            />
            <p className="text-xs text-muted-foreground">
              Loading today's menu...
            </p>
          </div>
        </div>
      ) : menuProducts.length > 0 ? (
        <div className="space-y-8 relative">
          {/* Shimmer overlay on top of cards during refresh */}
          <AnimatePresence>
            {refreshing && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 rounded-2xl pointer-events-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-background/55 backdrop-blur-[3px]" />
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(105deg,transparent 25%,rgba(56,189,248,0.08) 50%,transparent 75%)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                  <div className="flex items-center gap-3 bg-background/80 border border-cyan-400/30 rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full shrink-0"
                    />
                    <span className="text-sm font-semibold text-cyan-400 tracking-wide">Refreshing menu...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breakfast — full width */}
          {grouped['Breakfast'] && <CategorySection category="Breakfast" groupIdx={sortedCategories.indexOf('Breakfast')} grouped={grouped} cart={cart} cartMealType={cartMealType} canAddToCart={canAddToCart} addToCart={addToCart} updateCartQty={updateCartQty} clearCategoryCart={clearCategoryCart} />}

          {/* Lunch + Dinner — side by side */}
          {(grouped['Lunch'] || grouped['Dinner']) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {grouped['Lunch'] && (
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4">
                  <CategorySection category="Lunch" groupIdx={sortedCategories.indexOf('Lunch')} grouped={grouped} cart={cart} cartMealType={cartMealType} canAddToCart={canAddToCart} addToCart={addToCart} updateCartQty={updateCartQty} clearCategoryCart={clearCategoryCart} />
                </div>
              )}
              {grouped['Dinner'] && (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
                  <CategorySection category="Dinner" groupIdx={sortedCategories.indexOf('Dinner')} grouped={grouped} cart={cart} cartMealType={cartMealType} canAddToCart={canAddToCart} addToCart={addToCart} updateCartQty={updateCartQty} clearCategoryCart={clearCategoryCart} />
                </div>
              )}
            </div>
          )}

          {/* Any other categories */}
          {sortedCategories.filter(c => !['Breakfast','Lunch','Dinner'].includes(c)).map((category, i) => (
            <CategorySection key={category} category={category} groupIdx={i} grouped={grouped} cart={cart} cartMealType={cartMealType} canAddToCart={canAddToCart} addToCart={addToCart} updateCartQty={updateCartQty} clearCategoryCart={clearCategoryCart} />
          ))}

          {/* View Bill button */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center mt-5"
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow:
                      "0 0 24px rgba(212,175,55,0.7), 0 0 48px rgba(212,175,55,0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewBill}
                  className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg,#0a0a0a 0%,#1c1c1c 50%,#0a0a0a 100%)",
                    color: "#f5e6a3",
                    letterSpacing: "0.1em",
                    border: "1px solid rgba(212,175,55,0.55)",
                    boxShadow:
                      "0 0 14px rgba(212,175,55,0.35), 0 0 30px rgba(212,175,55,0.12), inset 0 1px 0 rgba(212,175,55,0.15)",
                  }}
                >
                  {/* gold shimmer sweep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg,transparent 30%,rgba(212,175,55,0.55) 50%,transparent 70%)",
                      opacity: 0.5,
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 1.8,
                    }}
                  />
                  {/* pulsing gold border */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: "1px solid rgba(212,175,55,0.7)" }}
                    animate={{ opacity: [0.2, 0.9, 0.2] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <ShoppingCart
                    className="w-3.5 h-3.5 shrink-0"
                    style={{
                      color: "#d4af37",
                      filter: "drop-shadow(0 0 5px rgba(212,175,55,1))",
                    }}
                  />
                  <span
                    style={{
                      textShadow:
                        "0 0 10px rgba(212,175,55,0.9), 0 0 20px rgba(212,175,55,0.4)",
                    }}
                  >
                    View Bill
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold"
                    style={{
                      background: "rgba(212,175,55,0.15)",
                      border: "1px solid rgba(212,175,55,0.45)",
                      color: "#d4af37",
                    }}
                  >
                    {totalItems}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">No items on today's menu yet.</p>
        </div>
      )}

      {/* Bill Paper */}
      <AnimatePresence>
        {showBill && cart.length > 0 && (
          <motion.div
            ref={billRef}
            key="bill"
            initial={{ opacity: 0, scaleY: 0, scaleX: 0.6, y: -20 }}
            animate={{ opacity: 1, scaleY: 1, scaleX: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0, scaleX: 0.6, y: -20 }}
            transition={{ duration: 1.0, ease: [0.12, 0.8, 0.2, 1] }}
            style={{ transformOrigin: "top center" }}
            className="mx-auto w-64"
          >
            <div className="bg-white rounded-t-lg h-2" />
            <div className="bg-white px-4 py-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-gray-900">
                  My Order
                </h3>
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowBill(false)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-400"
                  style={{ fontSize: "12px", fontWeight: 700 }}
                >
                  ✕
                </motion.button>
              </div>

              <div>
                <AnimatePresence initial={false}>
                  {cart.map((c) => (
                    <motion.div
                      key={c.product.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between py-2.5">
                        <p className="text-[11px] font-semibold text-gray-800 flex-1 leading-tight">
                          {c.product.name} x {c.quantity}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-gray-600 w-10 text-right">
                            ₹{c.product.price * c.quantity}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() =>
                                updateCartQty(c.product.id, c.quantity - 1)
                              }
                              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-[10px] font-bold"
                            >
                              −
                            </motion.button>
                            <motion.span
                              key={c.quantity}
                              initial={{ scale: 1.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 20,
                              }}
                              className="w-3 text-center text-[11px] font-semibold text-gray-800"
                            >
                              {c.quantity}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => addToCart(c.product)}
                              className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-[10px] font-bold"
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Order</span>
                  <AnimatedPrice value={total} />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Delivery</span>
                  <span>₹0</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-extrabold text-gray-900 mt-2.5 pt-2.5 border-t border-dashed border-gray-300">
                <span>Total Price</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.15, color: "#f97316" }}
                  animate={{ scale: 1, color: "#111" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  ₹{total}
                </motion.span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                className="w-full mt-4 py-2.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                style={{
                  background: "#1a1a1a",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                }}
              >
                Checkout →
              </motion.button>
            </div>
            <div className="flex">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-b-full bg-white border border-gray-200 border-t-0 mx-px"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Popup */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg,#0a0a14,#12122a,#0d1a2e)",
                border: "1px solid rgba(139,92,246,0.25)",
                boxShadow:
                  "0 0 60px rgba(139,92,246,0.2), 0 0 120px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* AI grid */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(139,92,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.06) 1px,transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* top neon line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg,transparent,#8b5cf6,#06b6d4,transparent)",
                }}
              />

              {/* corner glows */}
              <div
                className="absolute top-0 left-0 w-20 h-20 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)",
                }}
              />
              <div
                className="absolute bottom-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)",
                }}
              />

              {/* Video */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: "220px" }}
              >
                <video
                  src="/Man Swiping.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom,transparent 40%,#0a0a14 100%)",
                  }}
                />
              </div>

              {/* Content */}
              <div className="px-6 pb-7 pt-1 text-center relative z-10">
                <AnimatePresence mode="wait">
                  {!confirmed ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-center mb-3">
                        <div className="relative w-12 h-12">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute inset-0 rounded-full"
                              style={{
                                border:
                                  i === 0
                                    ? "1.5px solid #8b5cf6"
                                    : i === 1
                                      ? "1.5px solid #06b6d4"
                                      : "1.5px solid #a78bfa",
                              }}
                              animate={{
                                scale: [1, 1.4 + i * 0.15, 1],
                                opacity: [0.8, 0, 0.8],
                              }}
                              transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-violet-400" />
                          </div>
                        </div>
                      </div>
                      <p className="text-white font-black text-sm tracking-wide">
                        Processing Order
                      </p>
                      <div className="flex justify-center gap-1 mt-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirmed"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 20,
                      }}
                    >
                      {/* success ring */}
                      <div className="flex justify-center mb-3">
                        <div className="relative w-14 h-14">
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "rgba(34,197,94,0.1)",
                              border: "1.5px solid rgba(34,197,94,0.35)",
                            }}
                            animate={{ scale: [1, 1.18, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-2 rounded-full"
                            style={{ background: "rgba(34,197,94,0.08)" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 14,
                                delay: 0.1,
                              }}
                            >
                              <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white font-black text-base tracking-wide"
                      >
                        Order Confirmed!
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-white/50 text-[11px] mt-1"
                      >
                        Your food is being prepared 🍳
                      </motion.p>

                      {/* Order ID badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl"
                        style={{
                          background: "rgba(139,92,246,0.12)",
                          border: "1px solid rgba(139,92,246,0.3)",
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-black text-violet-300 tracking-widest">
                          ORD-{orderData?.id ?? orderId}
                        </span>
                      </motion.div>

                      {/* Done button */}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCloseCheckout}
                        className="w-full mt-5 py-2.5 rounded-2xl text-[11px] font-black text-white relative overflow-hidden tracking-widest uppercase"
                        style={{
                          background:
                            "linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)",
                          boxShadow: "0 0 24px rgba(139,92,246,0.45)",
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 opacity-20"
                          style={{
                            background:
                              "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.8) 50%,transparent 65%)",
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1,
                          }}
                        />
                        Done ✓
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
