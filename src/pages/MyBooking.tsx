import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import ApiService from '@/api/apiServices';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
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
  qr_code: string; // e.g. "qrcodes/order_20.png"
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export default function MyBooking() {
  const [orders, setOrders]   = useState<MyOrder[]>([]);
  const [menu, setMenu]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MyOrder | null>(null);

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/my-orders'),
      ApiService.get('/api/menu'),
    ]).then(([oRes, mRes]) => {
      setOrders(oRes.data ?? []);
      setMenu(mRes.data ?? []);
    }).catch(err => toast.error(ApiService.handleAxiosError(err, 'Failed to load bookings')))
      .finally(() => setLoading(false));
  }, []);

  const getMenuName = (menuId: number) =>
    menu.find(m => (m.menu_id ?? m.id) === menuId)?.name ?? `Item #${menuId}`;

  const today = toDateStr(new Date());
  const todayOrders = orders.filter(o => o.created_at && toDateStr(new Date(o.created_at)) === today);

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
    <div className="space-y-6">

      {/* Today's Bookings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-bold">Today's Bookings</p>
            <p className="text-xs text-muted-foreground">QR codes active for today only</p>
          </div>
        </div>

        {todayOrders.length === 0 ? (
          <div className="glass-strong rounded-2xl p-10 text-center border border-border/40">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No orders today</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Place an order from the Dashboard</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {todayOrders.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedOrder(order)}
                className="glass-strong rounded-2xl border border-orange-500/20 p-5 cursor-pointer hover:border-orange-400/50 transition-all">

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-orange-400">#{order.id}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Active
                  </span>
                </div>

                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-white rounded-xl">
                    <QRCodeSVG
                      value={buildAcknowledgedUrl(order, getMenuName)}
                      size={100}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground truncate">{getMenuName(it.menu_id)}</span>
                      <span className="text-xs font-semibold">×{it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-bold text-orange-400">₹{order.total_amount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>



      {/* QR Expand Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 !mt-0"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <div>
                  <p className="text-sm font-bold">Order #{selectedOrder.id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Scan to verify</p>
                </div>
                <button onClick={() => setSelectedOrder(null)}
                  className="w-7 h-7 rounded-lg bg-muted/40 hover:bg-muted/70 flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-4 pb-4 flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={buildAcknowledgedUrl(selectedOrder, getMenuName)}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
                <div className="w-full space-y-1.5">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{getMenuName(it.menu_id)}</span>
                      <span className="font-semibold">×{it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full flex justify-between pt-3 border-t border-border/40">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-orange-400">₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
