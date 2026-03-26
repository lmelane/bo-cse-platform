'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, LayoutDashboard, LogOut, User as UserIcon, UserCheck, QrCode, UserPlus } from 'lucide-react';
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
  const { user, logout, isSuperAdmin } = useAuth();

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
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-56 bg-white border-r border-neutral-200/60 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100">
        <h1 className="text-lg font-bold text-brand tracking-tight">CSE</h1>
        <p className="text-xs text-neutral-400 uppercase tracking-widest mt-0.5">Manager</p>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-4 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href === '/dashboard' && pathname === '/') ||
              (item.href === '/scanner/stats' && pathname?.startsWith('/scanner'));

            return (
              <li key={item.href}>
                {/* Section separator between Dashboard and the rest */}
                {index === 1 && (
                  <div className="border-t border-neutral-100 my-2" />
                )}
                {/* Section separator before Scanner QR */}
                {index === 4 && (
                  <div className="border-t border-neutral-100 my-2" />
                )}
                <Link
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand border-r-2 border-brand font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-brand" : "text-neutral-400")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* SuperAdmin only — invite admin */}
        {isSuperAdmin && (
          <>
            <div className="border-t border-neutral-100 my-2 mx-1" />
            <Link
              href="/admins/invite"
              onClick={onCloseMobileMenu}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors duration-150',
                pathname === '/admins/invite'
                  ? 'bg-brand-50 text-brand font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50'
              )}
            >
              <UserPlus className={cn("w-4 h-4", pathname === '/admins/invite' ? "text-brand" : "text-neutral-400")} />
              <span className="text-sm font-medium">Inviter un admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer avec utilisateur */}
      <div className="p-3 border-t border-neutral-100">
        {user && (
          <div className="mb-2 p-2.5 bg-neutral-50/80 rounded-lg">
            <div className="flex items-center gap-1.5 mb-0.5">
              <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-900 truncate">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-brand-50 text-brand text-[10px] font-medium rounded">
              {user.role?.toLowerCase() === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
    </>
  );
}
