'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, LayoutDashboard, LogOut, User as UserIcon, UserCheck, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Utilisateurs',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Événements',
    href: '/events',
    icon: Calendar,
  },
  {
    name: 'Participants',
    href: '/participants',
    icon: UserCheck,
  },
  {
    name: 'Scanner QR',
    href: '/scanner/stats',
    icon: QrCode,
  },
];

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function Sidebar({ isMobileMenuOpen = false, onCloseMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobileMenu}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-56 bg-white border-r border-neutral-200 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-lg font-bold text-brand">Admin CSE</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Back-office</p>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === '/dashboard' && pathname === '/') ||
              (item.href === '/scanner/stats' && pathname?.startsWith('/scanner'));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer avec utilisateur */}
      <div className="p-3 border-t border-neutral-200">
        {user && (
          <div className="mb-2 p-2.5 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-1.5 mb-0.5">
              <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-900 truncate">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-brand/10 text-brand text-[10px] font-medium rounded">
              Admin
            </span>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-neutral-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
    </>
  );
}
