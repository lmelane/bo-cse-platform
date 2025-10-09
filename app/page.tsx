import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { Users, Calendar, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-2">Bienvenue dans le back-office CSE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Utilisateurs */}
          <Link 
            href="/users"
            className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-brand hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/10 rounded-lg">
                  <Users className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900">Utilisateurs</h3>
                  <p className="text-sm text-neutral-600 mt-1">Gérer les utilisateurs et leurs rôles</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-brand group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Card Événements */}
          <Link 
            href="/events"
            className="bg-white p-6 rounded-xl border border-neutral-200 hover:border-brand hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900">Événements</h3>
                  <p className="text-sm text-neutral-600 mt-1">Gérer les événements CSE</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-brand group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
