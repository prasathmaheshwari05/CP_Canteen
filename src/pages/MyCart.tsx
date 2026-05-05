import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Pencil, X, Check, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '@/api/apiServices';

interface OrderItem { menu_id: number; quantity: number; }
interface MyOrder {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function MyCart() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMap, setEditMap] = useState<Record<number, OrderItem[]>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/my-orders'),
      ApiService.get('/api/menu'),
    ]).then(([oRes, mRes]) => {
      setOrders(oRes.data ?? []);
      setMenu(mRes.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      [orderId]: prev[orderId].map((it, i) =>
        i === idx ? { ...it, menu_id: menuId } : it
      ),
    }));

  const removeItem = (orderId: number, idx: number) =>
    setEditMap(prev => ({
      ...prev,
      [orderId]: prev[orderId].filter((_, i) => i !== idx),
    }));

  const addItem = (orderId: number) => {
    const usedIds = editMap[orderId].map(it => it.menu_id);
    const next = menu.find(m => !usedIds.includes(getMenuId(m)));
    if (!next) return toast.error('All menu items already added');
    setEditMap(prev => ({
      ...prev,
      [orderId]: [...prev[orderId], { menu_id: getMenuId(next), quantity: 1 }],
    }));
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

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="w-7 h-7 border-2 border-orange-400/30 border-t-orange-400 rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 p-2 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <p className="text-base font-bold">My Cart</p>
          <p className="text-xs text-muted-foreground">Your ordered items</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border/40 p-14 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No orders yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Place an order from the Dashboard</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order, i) => {
            const isEditing = !!editMap[order.id];
            const draftItems = editMap[order.id] ?? order.items;
            const draftTotal = draftItems.reduce((s, it) => s + getMenuPrice(it.menu_id) * it.quantity, 0);

            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/50 bg-card overflow-hidden">

                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-400">#{order.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      order.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        : order.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                        : 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                    }`}>{order.status}</span>

                    {!isEditing ? (
                      <button onClick={() => startEdit(order)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => saveEdit(order.id)} disabled={savingId === order.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                          <Check className="w-3 h-3" /> {savingId === order.id ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => cancelEdit(order.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/70 transition-colors">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 text-xs text-muted-foreground">
                        <th className="text-left px-5 py-2.5 font-semibold">Item</th>
                        <th className="text-center px-5 py-2.5 font-semibold">Qty</th>
                        <th className="text-right px-5 py-2.5 font-semibold">Price</th>
                        <th className="text-right px-5 py-2.5 font-semibold">Subtotal</th>
                        {isEditing && <th className="px-3 py-2.5" />}
                      </tr>
                    </thead>
                    <tbody>
                      {draftItems.map((it, idx) => {
                        const price = getMenuPrice(it.menu_id);
                        return (
                          <tr key={idx} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                            {/* Item name / dropdown */}
                            <td className="px-5 py-3">
                              {isEditing ? (
                                <select
                                  value={it.menu_id}
                                  onChange={e => updateMenuItem(order.id, idx, Number(e.target.value))}
                                  className="bg-muted/50 border border-border/50 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:border-orange-400/60 w-full max-w-[200px]"
                                >
                                  {menu.map(m => (
                                    <option key={getMenuId(m)} value={getMenuId(m)}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-medium">{getMenuName(it.menu_id)}</span>
                              )}
                            </td>

                            {/* Qty */}
                            <td className="px-5 py-3 text-center">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-2">
                                  <button onClick={() => updateQty(order.id, idx, -1)}
                                    className="w-6 h-6 rounded-md border border-border/50 bg-muted/40 hover:bg-muted flex items-center justify-center transition-colors">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-semibold">{it.quantity}</span>
                                  <button onClick={() => updateQty(order.id, idx, 1)}
                                    className="w-6 h-6 rounded-md border border-border/50 bg-muted/40 hover:bg-muted flex items-center justify-center transition-colors">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">×{it.quantity}</span>
                              )}
                            </td>

                            <td className="px-5 py-3 text-right text-muted-foreground">₹{price}</td>
                            <td className="px-5 py-3 text-right font-semibold">₹{price * it.quantity}</td>

                            {/* Remove row */}
                            {isEditing && (
                              <td className="px-3 py-3">
                                <button onClick={() => removeItem(order.id, idx)}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {isEditing && (
                        <tr>
                          <td colSpan={5} className="px-5 py-2">
                            <button onClick={() => addItem(order.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Add Item
                            </button>
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/20">
                        <td colSpan={isEditing ? 4 : 3} className="px-5 py-3 text-sm font-bold text-right">Total</td>
                        <td className="px-5 py-3 text-right text-base font-black text-orange-400">
                          ₹{isEditing ? draftTotal : order.total_amount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
