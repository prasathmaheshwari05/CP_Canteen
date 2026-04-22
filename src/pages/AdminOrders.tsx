import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Users, IndianRupee, Package, X, ChevronLeft, ChevronRight, Utensils, Calendar } from 'lucide-react';
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

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

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
      setOrders(prev => prev.map(o => o.id === Number(orderId) ? { ...o, status: 'received' } : o));
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
          <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={toDateStr(new Date())}
              onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-sm outline-none text-foreground w-full"
            />
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
                <AnimatePresence>
                  {paginated.map((order, i) => {
                    const empName = getUserName(order.user_id);
                    return (
                      <motion.tr key={order.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                        className="border-b border-border/30 hover:bg-muted/15 transition-colors">
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
                            order.status === 'received'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {order.status === 'received' ? '✓ Received' : '⏳ Pending'}
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
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
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
            <AnimatePresence>
              {paginated.map((order, i) => {
                const empName = getUserName(order.user_id);
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                    className="px-4 py-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-orange-400">#{order.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          order.status === 'received'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {order.status === 'received' ? '✓ Received' : '⏳ Pending'}
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors border border-border/50">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${currentPage === page ? 'text-white shadow-sm' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}
                      style={currentPage === page ? { background: 'linear-gradient(135deg,hsl(24 95% 53%),hsl(43 96% 52%))' } : {}}>
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-muted-foreground text-xs px-1">…</span>;
                }
                return null;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors border border-border/50">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
