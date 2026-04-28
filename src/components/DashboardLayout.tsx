import { ReactNode, useState, useRef, createContext, useContext } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { TopHeader } from '@/components/TopHeader';

export const ScrollContainerContext = createContext<React.RefObject<HTMLElement> | null>(null);
export const useScrollContainer = () => useContext(ScrollContainerContext);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 flex-shrink-0 transition-transform duration-300 lg:!translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <ScrollContainerContext.Provider value={scrollRef}>
          <main ref={scrollRef} className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </ScrollContainerContext.Provider>
      </div>
    </div>
  );
}
