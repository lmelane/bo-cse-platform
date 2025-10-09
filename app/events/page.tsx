import AdminLayout from '@/components/AdminLayout';
import { Calendar } from 'lucide-react';

export default function EventsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Événements</h1>
          <p className="text-neutral-600 mt-2">Gestion des événements CSE</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Page en construction
          </h3>
          <p className="text-neutral-600">
            La gestion des événements sera bientôt disponible.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
