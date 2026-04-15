import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-muted border border-border flex items-center px-1 transition-colors hover:border-primary/50"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ x: isDark ? 0 : 24 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shadow-md"
      >
        {isDark ? <Moon className="w-3 h-3 text-primary-foreground" /> : <Sun className="w-3 h-3 text-primary-foreground" />}
      </motion.div>
    </button>
  );
}
