import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Users, IndianRupee, Package, X, ChevronLeft, ChevronRight, Utensils, CalendarDays, RefreshCw, Sparkles, Printer } from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '@/api/apiServices';

interface OrderItem { menu_id: number; quantity: number; }
interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}
interface User { id: number; emp_id: number; emp_name: string; emp_mail: string; role: string; }

function printOrders(orders: Order[], users: User[], menu: any[], getMenuName: (id: number) => string, selectedDate: string) {
  const rows = orders.map(o => {
    const user = users.find(u => u.id === o.user_id) ?? users.find(u => u.emp_id === o.user_id);
    const empId = user?.emp_id ?? o.user_id;
    const empName = user?.emp_name ?? `User #${o.user_id}`;
    const items = o.items?.map(it => `${getMenuName(it.menu_id)} ×${it.quantity}`).join(', ') ?? '—';
    return `<tr>
      <td>${empId}</td>
      <td>${empName}</td>
      <td>#${o.id}</td>
      <td>${items}</td>
      <td>₹${o.total_amount}</td>
      <td style="text-align:center"><input type="checkbox" /></td>
    </tr>`;
  }).join('');

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

  const html = `<!DOCTYPE html><html><head><title>Orders – ${dateLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h2 { margin-bottom: 4px; font-size: 18px; }
    p { margin: 0 0 16px; color: #555; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 8px 10px; border: 1px solid #ddd; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h2>All Orders</h2><p>${dateLabel} &nbsp;·&nbsp; ${orders.length} order${orders.length !== 1 ? 's' : ''}</p>
  <table><thead><tr>
    <th>Emp ID</th><th>Name</th><th>Order ID</th><th>Items Ordered</th><th>Price</th><th>Food Received ✓</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <script>window.onload=()=>{window.print();}<\/script></body></html>`;

  const w = window.open('', '_blank', 'width=900,height=650');
  if (w) { w.document.write(html); w.document.close(); }
}

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function AiCalendar({ value, max, onChange }: { value: string; max: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [view, setView]     = useState<'days'|'months'|'years'>('days');
  const [pos, setPos]       = useState({ top: 0, right: 0 });
  const triggerRef          = useRef<HTMLButtonElement>(null);
  const dropdownRef         = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [cursor, setCursor] = useState({ y: selected.getFullYear(), m: selected.getMonth() });
  const maxDate = new Date(max + 'T00:00:00');
  const today   = new Date(toDateStr(new Date()) + 'T00:00:00');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const firstDay = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const pick = (day: number) => {
    const d = new Date(cursor.y, cursor.m, day);
    if (d > maxDate) return;
    onChange(toDateStr(d));
    setOpen(false);
  };

  const prevMonth = () => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const nextMonth = () => {
    const next = cursor.m === 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m: cursor.m + 1 };
    if (new Date(next.y, next.m, 1) <= maxDate) setCursor(next);
  };

  const yearRange = Array.from({ length: 12 }, (_, i) => cursor.y - 5 + i);

  const displayLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Select date';

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed z-[9999] w-72 rounded-2xl border border-orange-500/20 overflow-hidden bg-card"
          style={{ top: pos.top, right: pos.right, boxShadow: '0 0 40px hsl(24 95% 53% / 0.15), 0 20px 60px rgba(0,0,0,0.25)' }}
        >
            {/* Header glow strip */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(24 95% 53%), hsl(43 96% 52%), transparent)' }} />

            {/* Month/Year nav */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setView(v => v === 'months' ? 'days' : 'months')}
                  className="text-sm font-semibold hover:text-orange-400 transition-colors px-1 rounded">
                  {MONTHS[cursor.m]}
                </button>
                <button onClick={() => setView(v => v === 'years' ? 'days' : 'years')}
                  className="text-sm font-semibold hover:text-orange-400 transition-colors px-1 rounded">
                  {cursor.y}
                </button>
              </div>
              <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Month picker */}
            <AnimatePresence mode="wait">
              {view === 'months' && (
                <motion.div key="months" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-3 gap-1.5 px-3 pb-3">
                  {MONTHS.map((mn, i) => (
                    <button key={mn} onClick={() => { setCursor(c => ({ ...c, m: i })); setView('days'); }}
                      className={`text-xs py-1.5 rounded-lg font-medium transition-all ${
                        i === cursor.m
                          ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                      style={i === cursor.m ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' } : {}}>
                      {mn.slice(0, 3)}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Year picker */}
              {view === 'years' && (
                <motion.div key="years" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-3 gap-1.5 px-3 pb-3">
                  {yearRange.map(yr => (
                    <button key={yr} onClick={() => { setCursor(c => ({ ...c, y: yr })); setView('days'); }}
                      className={`text-xs py-1.5 rounded-lg font-medium transition-all ${
                        yr === cursor.y
                          ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                      style={yr === cursor.y ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' } : {}}>
                      {yr}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Day grid */}
              {view === 'days' && (
                <motion.div key="days" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 pb-3">
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d => (
                      <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {cells.map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const thisDate  = new Date(cursor.y, cursor.m, day);
                      const isSelected = toDateStr(thisDate) === value;
                      const isToday    = toDateStr(thisDate) === toDateStr(today);
                      const disabled   = thisDate > maxDate;
                      return (
                        <motion.button key={idx}
                          whileHover={!disabled ? { scale: 1.15 } : {}}
                          whileTap={!disabled ? { scale: 0.9 } : {}}
                          onClick={() => !disabled && pick(day)}
                          disabled={disabled}
                          className={`relative mx-auto w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                            disabled ? 'opacity-25 cursor-not-allowed' :
                            isSelected ? 'text-white shadow-lg' :
                            isToday   ? 'text-orange-400 border border-orange-500/40 bg-orange-500/10' :
                            'text-foreground hover:bg-muted/50'
                          }`}
                          style={isSelected ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))', boxShadow: '0 0 12px hsl(24 95% 53% / 0.5)' } : {}}>
                          {day}
                          {isToday && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {/* Today shortcut */}
                  <div className="mt-2 pt-2 border-t border-border/30 flex justify-center">
                    <button onClick={() => { onChange(toDateStr(today)); setOpen(false); }}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Today
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
  );

  return (
    <div>
      <motion.button
        ref={triggerRef}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={handleOpen}
        className="flex items-center gap-2 bg-muted/40 border border-border/50 hover:border-orange-500/40 rounded-xl px-3 py-2 transition-all group"
      >
        <div className="relative">
          <CalendarDays className="w-4 h-4 text-orange-400" />
          <Sparkles className="w-2 h-2 text-amber-400 absolute -top-1 -right-1" />
        </div>
        <span className="text-sm font-medium text-foreground">{displayLabel}</span>
        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </motion.button>
      {ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers]   = useState<User[]>([]);
  const [menu, setMenu]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(new Date()));
  const ITEMS_PER_PAGE = 10;

  const dateFilteredOrders = orders.filter(o =>
    o.created_at && toDateStr(new Date(o.created_at)) === selectedDate
  );

  const dateItemCounts = (() => {
    const map: Record<number, number> = {};
    dateFilteredOrders.forEach(o => {
      o.items?.forEach(it => { map[it.menu_id] = (map[it.menu_id] ?? 0) + it.quantity; });
    });
    return map;
  })();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, menuRes] = await Promise.all([
        ApiService.get('/api/admin/orders'),
        ApiService.get('/auth/users'),
        ApiService.get('/api/today-menu'),
      ]);
      setOrders(ordersRes.data ?? []);
      setMenu(menuRes.data ?? []);
      setUsers(usersRes.data ?? []);
    } catch (err: any) {
      toast.error(ApiService.handleAxiosError(err, 'Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handler = (e: Event) => {
      const { orderId } = (e as CustomEvent).detail;
      setOrders(prev => prev.map(o => o.id === Number(orderId) ? { ...o, status: 'approved' } : o));
    };
    window.addEventListener('qr-order-received', handler);
    return () => window.removeEventListener('qr-order-received', handler);
  }, []);

  const getUserName = (userId: number) => {
    const byId    = users.find(u => u.id === userId);
    const byEmpId = users.find(u => u.emp_id === userId);
    return (byId ?? byEmpId)?.emp_name ?? `User #${userId}`;
  };

  const getMenuName = (menuId: number) =>
    menu.find(m => (m.menu_id ?? m.id) === menuId)?.name ?? `Item #${menuId}`;

  const filtered = dateFilteredOrders;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Orders', value: dateFilteredOrders.length, icon: ShoppingBag, iconColor: '#f97316', cardBorder: 'border-orange-500/20', iconBg: 'bg-orange-500/15', clickable: true },
          { label: 'Total Revenue', value: `₹${dateFilteredOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)}`, icon: IndianRupee, iconColor: '#10b981', cardBorder: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15' },
          { label: 'Employees Ordered', value: new Set(dateFilteredOrders.map(o => o.user_id)).size, icon: Users, iconColor: '#f59e0b', cardBorder: 'border-amber-500/20', iconBg: 'bg-amber-500/15' },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => (card as any).clickable && setShowItemModal(true)}
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            className={`glass-strong p-4 rounded-2xl border ${card.cardBorder} flex items-center gap-3 transition-shadow ${(card as any).clickable ? 'cursor-pointer' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
            </div>
            <div>
              <p className="text-xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Item Breakdown Modal */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm !mt-0"
            onClick={() => setShowItemModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold">Menu Orders</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setShowItemModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted/70 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {menu.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <Utensils className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No menu items for today</p>
                  </div>
                ) : menu.map((item, i) => {
                  const id = item.menu_id ?? item.id;
                  const count = dateItemCounts[id] ?? 0;
                  return (
                    <motion.div key={id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                          <Utensils className="w-3.5 h-3.5 text-orange-400" />
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">ordered</span>
                        <span className={`text-sm font-bold min-w-[28px] text-center px-2 py-0.5 rounded-full ${count > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-muted/50 text-muted-foreground'}`}>
                          {count}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {menu.length > 0 && (
                <div className="px-5 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Total items ordered</span>
                  <span className="text-sm font-bold text-orange-400">
                    {Object.values(dateItemCounts).reduce((s, v) => s + v, 0)}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">All Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} of {dateFilteredOrders.length} orders</p>
          </div>
          <div className="flex items-center gap-2">
            <AiCalendar
              value={selectedDate}
              max={toDateStr(new Date())}
              onChange={v => { setSelectedDate(v); setCurrentPage(1); }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => printOrders(filtered, users, menu, getMenuName, selectedDate)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-gradient-to-br from-orange-500/15 to-orange-400/15 hover:from-orange-500/25 hover:to-orange-400/25 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <Printer className="w-3.5 h-3.5" /> Print Orders
            </motion.button>
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={fetchOrders}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500/15 to-orange-400/15 hover:from-orange-500/25 hover:to-orange-400/25 transition-all cursor-pointer border border-orange-500/30 hover:border-orange-500/50 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-orange-400" />
            </motion.div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/10">
                {['Order ID', 'Employee', 'Items Ordered', 'Total', 'Status', 'Date & Time'].map((h) => (
                  <th key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-5 py-3.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        className="w-7 h-7 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
                      <p className="text-xs text-muted-foreground">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No orders for this date</p>
                  </td>
                </tr>
              ) : (
                <>
                  {paginated.map((order) => {
                    const empName = getUserName(order.user_id);
                    return (
                      <tr key={order.id} className="border-b border-border/30 hover:bg-muted/15 transition-colors">
                        <td className="px-5 py-4"><span className="text-xs font-bold text-orange-400">#{order.id}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}>
                              {empName[0].toUpperCase()}
                            </div>
                            <p className="text-sm font-semibold">{empName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {order.items?.map((it, idx) => (
                              <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-foreground">
                                {getMenuName(it.menu_id)} ×{it.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4"><p className="text-sm font-bold">₹{order.total_amount}</p></td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            order.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {order.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-muted-foreground">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-border/30">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="w-7 h-7 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
              <p className="text-xs text-muted-foreground">Loading orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders for this date</p>
            </div>
          ) : (
            <>
              {paginated.map((order) => {
                const empName = getUserName(order.user_id);
                return (
                  <div key={order.id} className="px-4 py-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-orange-400">#{order.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          order.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {order.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                        </span>
                        <span className="text-sm font-bold">₹{order.total_amount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}>
                        {empName[0].toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold">{empName}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {order.items?.map((it, idx) => (
                        <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 border border-border/50 text-foreground">
                          {getMenuName(it.menu_id)} ×{it.quantity}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
                          new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border/50">
            {/* Left: count info */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span>
                {' '}of{' '}
                <span className="font-semibold text-foreground">{filtered.length}</span> orders
              </p>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/50 bg-muted/30 text-foreground hover:border-orange-500/40 hover:bg-orange-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </motion.button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isActive = currentPage === page;
                const show = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                const isDot = page === currentPage - 2 || page === currentPage + 2;
                if (isDot) return (
                  <span key={page} className="w-6 text-center text-muted-foreground text-xs select-none">·</span>
                );
                if (!show) return null;
                return (
                  <motion.button
                    key={page}
                    whileHover={!isActive ? { scale: 1.1 } : {}}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentPage(page)}
                    className={`relative h-8 w-8 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:border-orange-500/30 hover:bg-orange-500/5'
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))', boxShadow: '0 0 14px hsl(24 95% 53% / 0.4)' } : {}}
                  >
                    {page}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
                    )}
                  </motion.button>
                );
              })}

              {/* Next */}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/50 bg-muted/30 text-foreground hover:border-orange-500/40 hover:bg-orange-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
