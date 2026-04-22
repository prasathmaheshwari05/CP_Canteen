import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ChefHat, ClipboardList, ShoppingBag, IndianRupee, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiService from '@/api/apiServices';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [todayMenu, setTodayMenu] = useState<any[]>([]);
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/menu'),
      ApiService.get('/api/today-menu'),
      ApiService.get('/api/admin/orders'),
    ]).then(([pRes, mRes, oRes]) => {
      setProducts(pRes.data ?? []);
      setTodayMenu(mRes.data ?? []);
      setOrders(oRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue      = orders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const uniqueEmployees   = new Set(orders.map((o: any) => o.user_id)).size;

  const cards = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      iconColor: '#f97316',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/15',
      href: '/products',
    },
    {
      label: "Today's Menu",
      value: todayMenu.length,
      icon: ChefHat,
      iconColor: '#a855f7',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/15',
      href: '/menu',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ClipboardList,
      iconColor: '#10b981',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
      href: '/orders',
    },
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue}`,
      icon: IndianRupee,
      iconColor: '#f59e0b',
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/15',
      href: '/orders',
    },
  ];

  return (
    <div className="space-y-6">

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            onClick={() => navigate(card.href)}
            className={`glass-strong p-5 rounded-2xl border ${card.border} flex items-center gap-4 cursor-pointer transition-shadow`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
              <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              {loading
                ? <div className="h-7 w-12 bg-muted/50 rounded animate-pulse mb-1" />
                : <p className="text-2xl font-bold">{card.value}</p>
              }
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Today's Menu Items */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="glass-strong rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <p className="text-sm font-bold">Today's Menu</p>
              <p className="text-xs text-muted-foreground mt-0.5">{todayMenu.length} items published</p>
            </div>
            <button onClick={() => navigate('/menu')}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border/30 max-h-52 overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                  <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
                </div>
              ))
            ) : todayMenu.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ChefHat className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No menu published today</p>
              </div>
            ) : todayMenu.map((item: any, i: number) => (
              <motion.div key={item.menu_id ?? item.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.34 + i * 0.04 }}
                className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                    <ChefHat className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-orange-400">₹{item.price}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Orders Summary */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="glass-strong rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <p className="text-sm font-bold">Orders Summary</p>
              <p className="text-xs text-muted-foreground mt-0.5">All time overview</p>
            </div>
            <button onClick={() => navigate('/orders')}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Total Orders</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">{loading ? '—' : orders.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Revenue</span>
              </div>
              <span className="text-sm font-bold text-amber-400">{loading ? '—' : `₹${totalRevenue}`}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Employees Ordered</span>
              </div>
              <span className="text-sm font-bold text-orange-400">{loading ? '—' : uniqueEmployees}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
