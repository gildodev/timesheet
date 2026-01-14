/**
 * App Layout component
 * Main layout with sidebar and navbar
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  FileText,
  Timer,
  Settings,
  Crown,
  Menu,
  X,
  LogOut,
  Search,
  Hash,
  Target,
  CalendarDays,
  TrendingUp,
  Layers,
  Bell,
} from 'lucide-react';
import { Button } from './ui/button';
import { PremiumBadge } from './PremiumBadge';
import { GlobalSearch } from './GlobalSearch';
import { TagManager } from './TagManager';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { usePremium } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { toast } from 'sonner';

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const { isPremium } = usePremium();
  const { user, logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate sidebar on mount
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  useEffect(() => {
    // Close mobile sidebar on route change
    setMobileOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projetos', href: '/projects', icon: FolderKanban },
    { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
    { name: 'Timesheet', href: '/timesheet', icon: Clock },
    { name: 'Lembretes', href: '/reminders', icon: Bell },
    { name: 'Calendário', href: '/calendar', icon: CalendarDays },
    { name: 'Relatórios', href: '/reports', icon: FileText },
    { name: 'Comparar', href: '/compare', icon: TrendingUp },
    { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
    { name: 'Metas', href: '/goals', icon: Target },
    { name: 'Templates', href: '/templates', icon: Layers },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold gradient-text">TimeFlow</h1>
            {user && (
              <p className="text-sm text-muted-foreground truncate">{user.username}</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-secondary text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>



      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {sidebarOpen ? (
          <SidebarContent />
        ) : (
          <div className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary text-foreground'
                  )}
                  title={item.name}
                >
                  <item.icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h2 className="text-lg font-semibold hidden sm:block">
              {navigation.find((item) => item.href === location.pathname)?.name || 'TimeFlow'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTagManagerOpen(true)}
              title="Tags (Ctrl+T)"
            >
              <Hash className="w-4 h-4" />
            </Button>

            {user && (
              <div className="hidden sm:block text-sm text-right">
                <p className="font-medium">{user.username}</p>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Global Components */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />
      <KeyboardShortcuts
        onOpenSearch={() => setSearchOpen(true)}
        onOpenTagManager={() => setTagManagerOpen(true)}
        onStartTimer={() => toast.info('Use o Dashboard para iniciar timer')}
      />
    </div>
  );
}
