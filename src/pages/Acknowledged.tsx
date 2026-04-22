import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Hash, Sparkles } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderData {
  id: number;
  items: OrderItem[];
  total: number;
}

export default function Acknowledged() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const itemsParam = searchParams.get('items');
    const totalParam = searchParams.get('total');

    if (!orderId || !itemsParam || !totalParam) {
      setError('Invalid order data.');
      return;
    }

    try {
      const items: OrderItem[] = JSON.parse(decodeURIComponent(itemsParam));
      setOrder({ id: parseInt(orderId), items, total: parseFloat(totalParam) });
    } catch {
      setError('Failed to parse order details.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => setShowContent(true), 2800);
      return () => clearTimeout(timer);
    }
  }, [order]);

  if (error || (!order && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 70%), #0a0a0f' }}>
        <div className="text-center">
          {error
            ? <><p className="text-red-400 font-semibold text-lg">{error}</p>
                <p className="text-muted-foreground text-sm mt-2">Please contact the counter staff.</p></>
            : <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full mx-auto" />
          }
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 65%), #0a0a0f' }}>

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Success Tick Video */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mb-2"
      >
        <div className="w-40 h-40 rounded-full overflow-hidden relative"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.35), 0 0 120px rgba(16,185,129,0.15)' }}>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 z-10" />
          <video ref={videoRef} src="/Success Tick.mp4" autoPlay muted playsInline
            className="w-full h-full object-cover" />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-emerald-400/50"
        />
      </motion.div>

      {/* Order Received */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Confirmed</span>
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2"
          style={{ textShadow: '0 0 40px rgba(16,185,129,0.4)' }}>
          Order Received
        </h1>
        <p className="text-muted-foreground text-sm">Your meal is being prepared with care</p>
      </motion.div>

      {/* Order Card */}
      <AnimatePresence>
        {showContent && order && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-sm relative"
          >
            <div className="absolute inset-0 rounded-2xl opacity-60"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(249,115,22,0.1))', filter: 'blur(1px)' }} />

            <div className="relative rounded-2xl border border-emerald-500/20 overflow-hidden"
              style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>

              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/5"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(249,115,22,0.04))' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Order ID</p>
                      <p className="text-base font-bold text-emerald-400">#{order.id}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}>
                    ✓ Received
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center gap-1.5 mb-3">
                  <Utensils className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Items</p>
                </div>

                {order.items.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,191,36,0.1))' }}>
                        🍽️
                      </div>
                      <span className="text-sm font-medium text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">×</span>
                      <span className="text-sm font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>
                        {item.quantity}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs text-muted-foreground font-medium">Total Amount</span>
                <span className="text-lg font-bold"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ₹{order.total}
                </span>
              </div>
            </div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-center text-xs text-muted-foreground mt-4">
              Please collect your order from the counter 🙏
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
