import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: 'primary' | 'secondary' | 'accent' | 'success';
}

const colorMap = {
  primary: { bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/25', icon: 'bg-orange-500/20 text-orange-400', glow: 'rgba(249,115,22,0.15)' },
  secondary: { bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/25', icon: 'bg-amber-500/20 text-amber-400', glow: 'rgba(245,158,11,0.15)' },
  accent: { bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/25', icon: 'bg-red-500/20 text-red-400', glow: 'rgba(239,68,68,0.15)' },
  success: { bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/25', icon: 'bg-emerald-500/20 text-emerald-400', glow: 'rgba(16,185,129,0.15)' },
};

export function StatCard({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -3 }}
      className={`rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} p-5 transition-all duration-300 backdrop-blur-sm`}
      style={{ boxShadow: `0 4px 24px ${c.glow}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trendUp ? '▲' : '▼'}</span> {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
