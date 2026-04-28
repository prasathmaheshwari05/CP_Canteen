import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CheckCircle, UtensilsCrossed } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const catEmojis: Record<string, string> = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙'
};

export default function UserCart() {
  const { cart, updateCartQty, removeFromCart, clearCart, addOrder } = useAppStore();
  const [ordered, setOrdered] = useState(false);
  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handleOrder = () => {
    if (cart.length === 0) return;
    addOrder({
      id: `o${Date.now()}`,
      userId: '2',
      userName: 'You',
      items: [...cart],
      total,
      status: 'pending',
      createdAt: new Date(),
    });
    clearCart();
    setOrdered(true);
    toast.success('Order placed successfully!');
  };

  if (ordered) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
          style={{ boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
        >
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-3xl font-bold mb-2">Order Placed! 🎉</h2>
          <p className="text-muted-foreground mb-2">Your food is being prepared with love</p>
          <p className="text-sm text-muted-foreground mb-8">You'll be notified when it's ready</p>
          <Link to="/">
            <Button
              className="text-white font-semibold px-6"
              style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Menu
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''} ready to order` : 'Nothing here yet'}
          </p>
        </div>
        <Link to="/" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1.5 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue ordering
        </Link>
      </div>

      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Cart is empty</h3>
          <p className="text-sm text-muted-foreground">Browse today's menu and add something delicious!</p>
          <Link to="/">
            <Button
              className="mt-5 text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}
            >
              Explore Menu
            </Button>
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-3">
            <AnimatePresence>
              {cart.map((item, i) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-strong p-4 rounded-2xl flex items-center justify-between gap-4 border border-border/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-500/10 flex items-center justify-center text-2xl shrink-0">
                      {item.product.images?.[0]
                        ? <img src={item.product.images[0]} className="w-full h-full object-cover rounded-xl" alt={item.product.name} />
                        : catEmojis[item.product.category] || '🍽️'
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">₹{item.product.price} each</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-sm w-16 text-right text-orange-400">
                      ₹{item.product.price * item.quantity}
                    </p>
                    <button
                      onClick={() => { removeFromCart(item.product.id); toast.success('Item removed'); }}
                      className="p-2 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong p-6 rounded-2xl border border-orange-500/15"
            style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.08)' }}
          >
            <h3 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Order Summary</h3>

            <div className="space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product.name} ×{item.quantity}</span>
                  <span>₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-4 mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span className="text-sm">₹{total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold text-orange-400">₹{total}</span>
              </div>
            </div>

            <Button
              className="w-full mt-5 text-white font-semibold py-6 text-base shadow-lg shadow-orange-500/25"
              style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}
              onClick={handleOrder}
            >
              <UtensilsCrossed className="w-5 h-5 mr-2" /> Place Order · ₹{total}
            </Button>
          </motion.div>
        </>
      )}
    </div>
  );
}
