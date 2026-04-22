import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Shield, User as UserIcon, ArrowRight, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ApiService from '@/api/apiServices';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [todayMenu, setTodayMenu] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      ApiService.get('/auth/users'),
      ApiService.get('/api/menu'),
      ApiService.get('/api/today-menu'),
    ]).then(([uRes, pRes, mRes]) => {
      setUsers(uRes.data ?? []);
      setProducts(pRes.data ?? []);
      setTodayMenu(mRes.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const admins     = users.filter(u => u.role === 'admin').length;
  const regularUsers = users.filter(u => u.role === 'user').length;
  const available  = products.filter(p => p.available).length;
  const unavailable = products.length - available;

  const cards = [
    {
      label: 'Total Users',
      value: users.length,
      icon: Users,
      iconColor: '#f97316',
      border: 'border-orange-500/20',
      iconBg: 'bg-orange-500/15',
      href: '/users',
    },
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      iconColor: '#10b981',
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
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
  ];

  return (
    <div className="space-y-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
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

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Users Breakdown */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="glass-strong p-5 rounded-2xl border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Users Breakdown</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Admins</span>
              </div>
              <span className="text-sm font-bold text-orange-400">
                {loading ? '—' : admins}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Users</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {loading ? '—' : regularUsers}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Products Breakdown */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="glass-strong p-5 rounded-2xl border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Products Breakdown</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Available</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {loading ? '—' : available}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Unavailable</span>
              </div>
              <span className="text-sm font-bold text-red-400">
                {loading ? '—' : unavailable}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-strong rounded-2xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div>
            <p className="text-sm font-bold">Recent Users</p>
            <p className="text-xs text-muted-foreground mt-0.5">Latest registered employees</p>
          </div>
          <button onClick={() => navigate('/users')}
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-border/30">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-28 bg-muted/50 rounded animate-pulse" />
                  <div className="h-2.5 w-40 bg-muted/40 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : users.slice(0, 5).map((u, i) => (
            <motion.div key={u.emp_id ?? i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.05 }}
              className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(43 96% 52%))' }}>
                {(u.emp_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{u.emp_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.emp_mail}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                u.role === 'admin'
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              }`}>
                {u.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
