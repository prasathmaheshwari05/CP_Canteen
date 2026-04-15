import { ReactNode, useState, useRef, createContext, useContext } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { TopHeader } from '@/components/TopHeader';

export const ScrollContainerContext = createContext<React.RefObject<HTMLElement> | null>(null);
export const useScrollContainer = () => useContext(ScrollContainerContext);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        <ScrollContainerContext.Provider value={scrollRef}>
          <main ref={scrollRef} className="flex-1 p-6 overflow-auto scrollbar-thin">
            {children}
          </main>
        </ScrollContainerContext.Provider>
      </div>
    </div>
  );
}
