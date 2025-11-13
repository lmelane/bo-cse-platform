'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, LayoutDashboard, LogOut, User as UserIcon, UserCheck } from 'lucide-react';
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-brand">Admin CSE</h1>
        <p className="text-sm text-neutral-500 mt-1">Back-office</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer avec utilisateur */}
      <div className="p-4 border-t border-neutral-200">
        {user && (
          <div className="mb-3 p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <UserIcon className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-brand/10 text-brand text-xs font-medium rounded">
              Admin
            </span>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
