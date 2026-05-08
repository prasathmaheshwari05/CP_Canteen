import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Package, X, Clock, Calendar, ChevronRight, Pencil, Trash2, Check, Plus, Minus, AlertTriangle, ChevronDown, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import ApiService from '@/api/apiServices';

const FRONTEND_URL = window.location.origin;
const buildAcknowledgedUrl = (order: MyOrder, getMenuName: (id: number) => string) => {
  const items = order.items.map(it => ({ name: getMenuName(it.menu_id), quantity: it.quantity }));
  return `${FRONTEND_URL}/acknowledged?order_id=${order.id}&items=${encodeURIComponent(JSON.stringify(items))}&total=${order.total_amount}`;
};

interface OrderItem { menu_id: number; quantity: number; }
interface MyOrder {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  qr_code: string;
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export default function MyBooking() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MyOrder | null>(null);
  const [editMap, setEditMap] = useState<Record<number, OrderItem[]>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openDropKey, setOpenDropKey] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openDropKey) return;
    const handler = (e: MouseEvent) => {
      const trigger = triggerRefs.current[openDropKey];
      const list = dropListRef.current;
      if (
        trigger && !trigger.contains(e.target as Node) &&
        list && !list.contains(e.target as Node)
      ) setOpenDropKey(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropKey]);

  const openDrop = (key: string) => {
    const btn = triggerRefs.current[key];
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setDropPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: Math.max(r.width, 250) });
    setOpenDropKey(key);
  };

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    Promise.all([
      ApiService.get('/api/my-orders'),
      ApiService.get('/api/menu'),
    ]).then(([oRes, mRes]) => {
      setOrders(oRes.data ?? []);
      setMenu(mRes.data ?? []);
    }).catch(err => toast.error(ApiService.handleAxiosError(err, 'Failed to load bookings')))
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const getMenuId = (m: any) => m.menu_id ?? m.id;
  const getMenuName = (menuId: number) => menu.find(m => getMenuId(m) === menuId)?.name ?? `Item #${menuId}`;
  const getMenuPrice = (menuId: number) => menu.find(m => getMenuId(m) === menuId)?.price ?? 0;

  const startEdit = (order: MyOrder) =>
    setEditMap(prev => ({ ...prev, [order.id]: order.items.map(it => ({ ...it })) }));

  const cancelEdit = (orderId: number) =>
    setEditMap(prev => { const n = { ...prev }; delete n[orderId]; return n; });

  const updateQty = (orderId: number, idx: number, delta: number) =>
    setEditMap(prev => ({
      ...prev,
      [orderId]: prev[orderId].map((it, i) =>
        i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
      ),
    }));

  const updateMenuItem = (orderId: number, idx: number, menuId: number) =>
    setEditMap(prev => ({
      ...prev,
      [orderId]: prev[orderId].map((it, i) => i === idx ? { ...it, menu_id: menuId } : it),
    }));

  const removeItem = (orderId: number, idx: number) =>
    setEditMap(prev => ({ ...prev, [orderId]: prev[orderId].filter((_, i) => i !== idx) }));

  const getMenuCategory = (menuId: number) => menu.find(m => getMenuId(m) === menuId)?.category ?? '';

  const getOrderCategory = (orderId: number) => {
    const items = editMap[orderId] ?? [];
    if (!items.length) return '';
    return getMenuCategory(items[0].menu_id);
  };

  const addItem = (orderId: number) => {
    const usedIds = editMap[orderId].map(it => it.menu_id);
    const orderCat = getOrderCategory(orderId);
    const next = menu.find(m => !usedIds.includes(getMenuId(m)) && (!orderCat || (m.category ?? '').toLowerCase() === orderCat.toLowerCase()));
    if (!next) return toast.error(`All ${orderCat || 'menu'} items already added`);
    setEditMap(prev => ({ ...prev, [orderId]: [...prev[orderId], { menu_id: getMenuId(next), quantity: 1 }] }));
  };

  const saveEdit = async (orderId: number) => {
    const items = editMap[orderId];
    if (!items?.length) return toast.error('Order must have at least one item');
    setSavingId(orderId);
    try {
      const res = await ApiService.put(`/api/order/${orderId}`, { items });
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, items, total_amount: res.data?.total_amount ?? items.reduce((s, it) => s + getMenuPrice(it.menu_id) * it.quantity, 0) }
          : o
      ));
      cancelEdit(orderId);
      toast.success('Order updated!');
    } catch (err: any) {
      toast.error(ApiService.handleAxiosError(err, 'Update failed'));
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await ApiService.delete(`/api/order/${deleteId}`);
      setOrders(prev => prev.filter(o => o.id !== deleteId));
      toast.success('Order deleted');
    } catch (err: any) {
      toast.error(ApiService.handleAxiosError(err, 'Delete failed'));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const today = toDateStr(new Date());

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="w-7 h-7 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
        <p className="text-xs text-muted-foreground">Loading your bookings...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-2 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">My Bookings</h1>
            <p className="text-xs text-muted-foreground">Track your orders & scan QR codes</p>
          </div>
        </div>
        <motion.div
          whileHover={{ rotate: 180, scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={() => fetchData(true)}
          title="Refresh bookings"
          className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500/15 to-orange-400/15 hover:from-orange-500/25 hover:to-orange-400/25 border border-orange-500/30 hover:border-orange-500/50 transition-all shadow-sm cursor-pointer">
          <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
            <RefreshCw className="w-4 h-4 text-orange-400" />
          </motion.div>
        </motion.div>
      </div>

      {orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/40 p-16 text-center bg-gradient-to-br from-background to-muted/20">
          <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-base font-semibold text-muted-foreground mb-2">No bookings yet</p>
          <p className="text-sm text-muted-foreground/60">Start ordering from the Dashboard</p>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">QR Code</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const isToday = toDateStr(new Date(order.created_at)) === today;
                  const isEditing = !!editMap[order.id];
                  const draftItems = editMap[order.id] ?? order.items;
                  const draftTotal = draftItems.reduce((s, it) => s + getMenuPrice(it.menu_id) * it.quantity, 0);

                  return (
                    <motion.tr key={order.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`border-b border-border/20 transition-colors ${isEditing ? 'bg-orange-500/5' : 'hover:bg-muted/20'}`}>

                      {/* Order ID */}
                      <td className="px-6 py-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center border border-orange-500/30">
                          <span className="text-xs font-bold text-orange-500">#{order.id}</span>
                        </div>
                      </td>

                      {/* Items — view or edit */}
                      <td className="px-6 py-5">
                        {!isEditing ? (
                          <div className="space-y-1 max-w-xs">
                            {order.items?.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <ChevronRight className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="font-medium truncate">{getMenuName(it.menu_id)}</span>
                                <span className="text-muted-foreground shrink-0">×{it.quantity}</span>
                              </div>
                            ))}
                            {order.items?.length > 2 && (
                              <p className="text-xs text-muted-foreground pl-5">+{order.items.length - 2} more</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 w-[260px]">
                            <AnimatePresence initial={false}>
                              {draftItems.map((it, idx) => {
                                const dropKey = `${order.id}-${idx}`;
                                const isOpen = openDropKey === dropKey;
                                const selectedMenu = menu.find(m => getMenuId(m) === it.menu_id);
                                return (
                                  <motion.div key={idx}
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2">
                                    {/* Custom dropdown — portal rendered outside overflow-hidden card */}
                                    <div className="flex-1 min-w-0">
                                      <button type="button"
                                        ref={el => { triggerRefs.current[dropKey] = el; }}
                                        onClick={() => isOpen ? setOpenDropKey(null) : openDrop(dropKey)}
                                        className="w-full h-9 flex items-center justify-between px-3 rounded-xl border border-orange-500/40 bg-orange-500/10 text-orange-500 text-sm font-medium transition-all hover:border-orange-500/60">
                                        <span className="flex items-center gap-2 truncate">
                                          <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                                          <span className="truncate">{selectedMenu?.name ?? `Item #${it.menu_id}`}</span>
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                    {/* Pill quantity stepper */}
                                    <div className="flex items-center shrink-0 rounded-full border border-orange-500/30 bg-background overflow-hidden">
                                      <button onClick={() => updateQty(order.id, idx, -1)}
                                        className="w-7 h-7 flex items-center justify-center text-orange-500 hover:bg-orange-500/15 transition-colors">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-bold">{it.quantity}</span>
                                      <button onClick={() => updateQty(order.id, idx, 1)}
                                        className="w-7 h-7 flex items-center justify-center text-orange-500 hover:bg-orange-500/15 transition-colors">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    {/* Remove */}
                                    <button onClick={() => removeItem(order.id, idx)}
                                      className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 flex items-center justify-center transition-all shrink-0">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              onClick={() => addItem(order.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-orange-500/40 text-xs text-orange-500 hover:bg-orange-500/5 hover:border-orange-500/60 font-semibold transition-all">
                              <Plus className="w-3 h-3" /> Add item
                            </motion.button>
                          </div>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                          order.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : order.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
                            : 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* QR Code */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {isToday ? (
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 bg-card rounded-lg border border-border/50 hover:border-orange-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer">
                              <QRCodeSVG value={buildAcknowledgedUrl(order, getMenuName)} size={40} bgColor="transparent" fgColor="currentColor" level="M" />
                            </motion.button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Expired</span>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-5 text-right">
                        <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                          ₹{isEditing ? draftTotal : order.total_amount}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          {!isEditing ? (
                            <>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => startEdit(order)}
                                className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 flex items-center justify-center transition-colors"
                                title="Edit order">
                                <Pencil className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setDeleteId(order.id)}
                                className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center transition-colors"
                                title="Delete order">
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => saveEdit(order.id)}
                                disabled={savingId === order.id}
                                className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center transition-colors disabled:opacity-50"
                                title="Save">
                                {savingId === order.id
                                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full" />
                                  : <Check className="w-3.5 h-3.5" />}
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => cancelEdit(order.id)}
                                className="w-8 h-8 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 text-muted-foreground flex items-center justify-center transition-colors"
                                title="Cancel">
                                <X className="w-3.5 h-3.5" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portal dropdown list — rendered outside overflow-hidden card */}
      {openDropKey && dropPos && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropListRef}
            key={openDropKey}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
            className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
            {(() => {
              const [orderId, idxStr] = openDropKey.split('-');
              const items = editMap[Number(orderId)] ?? [];
              const currentMenuId = items[Number(idxStr)]?.menu_id;
              const orderCat = getMenuCategory(items[0]?.menu_id ?? 0);
              const filteredMenu = orderCat
                ? menu.filter(m => (m.category ?? '').toLowerCase() === orderCat.toLowerCase())
                : menu;
              return filteredMenu.map(m => {
                const mId = getMenuId(m);
                const isSelected = currentMenuId === mId;
                return (
                  <button key={mId} type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { updateMenuItem(Number(orderId), Number(idxStr), mId); setOpenDropKey(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors border-b border-border/20 last:border-0 text-left ${
                      isSelected ? 'bg-orange-500/10' : 'hover:bg-muted/40'
                    }`}>
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-orange-500 truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">₹{m.price}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-orange-400' : 'border-border'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-orange-400" />}
                    </div>
                  </button>
                );
              });
            })()}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* QR Popup Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 !mt-0"
            onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-lg">Order #{selectedOrder.id}</p>
                  <p className="text-white/80 text-xs">Scan to verify your order</p>
                </div>
                <button onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-orange-500/20">
                  <QRCodeSVG value={buildAcknowledgedUrl(selectedOrder, getMenuName)} size={200} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
                <div className="w-full space-y-2">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm font-medium">{getMenuName(it.menu_id)}</span>
                      <span className="text-sm font-bold text-orange-500">×{it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full flex justify-between items-center pt-3 border-t-2 border-border/40">
                  <span className="text-base font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    ₹{selectedOrder.total_amount}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 !mt-0"
            onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-base mb-1">Delete Order #{deleteId}?</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-semibold hover:bg-muted/50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
