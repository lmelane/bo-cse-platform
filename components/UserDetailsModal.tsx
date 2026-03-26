'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { User as UserType, usersApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUserUpdated?: (updatedUser: UserType) => void;
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500 w-32 flex-shrink-0">{label}</span>
      <span className={`text-sm text-neutral-900 text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value || <span className="text-neutral-400">—</span>}
      </span>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-green-500' : 'bg-neutral-300'}`} />;
}

export default function UserDetailsModal({ isOpen, onClose, user, onUserUpdated }: UserDetailsModalProps) {
  const queryClient = useQueryClient();
  const [showSubForm, setShowSubForm] = useState(false);
  const [subType, setSubType] = useState<'event_based' | 'unlimited'>('event_based');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const resetForm = () => { setShowSubForm(false); setSubType('event_based'); setStartDate(''); setEndDate(''); };

  const handleCreateSub = async () => {
    if (!startDate || !endDate) { toast.error('Dates requises'); return; }
    if (new Date(endDate) <= new Date(startDate)) { toast.error('Date fin > date début'); return; }
    try {
      setIsSubmitting(true);
      const result = await usersApi.createSubscription(user.id, {
        subscription_type: subType,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
      toast.success(result.message || 'Abonnement créé');
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (onUserUpdated && result.data) onUserUpdated(result.data as UserType);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur');
    } finally { setIsSubmitting(false); }
  };

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';
  const fmtPrice = (c: number | null) => c ? `${(c / 100).toFixed(2)} €` : '—';
  const posDur: Record<string, string> = { less_than_1: '<1 an', '1_to_3': '1-3 ans', '3_to_5': '3-5 ans', more_than_5: '5+ ans' };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[100]" onClick={onClose} />

      {/* Slide-over panel from right */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">{user.firstName} {user.lastName}</h2>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-md">
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              <StatusDot active={user.role.toLowerCase() !== 'user'} />
              {user.role.toLowerCase() === 'superadmin' ? 'Super Admin' : user.role.toLowerCase() === 'admin' ? 'Admin' : 'Utilisateur'}
            </span>
            <span className="inline-flex items-center bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
              <StatusDot active={user.subscriptionStatus === 'ACTIVE'} />
              {user.subscriptionStatus === 'ACTIVE' ? 'Abonnement actif' : user.subscriptionStatus === 'EXPIRED' ? 'Expiré' : 'Aucun abonnement'}
            </span>
          </div>

          {/* Personal info */}
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Informations</p>
            <div className="bg-white">
              <Row label="Email" value={user.email} />
              <Row label="Association" value={user.association} />
              {user.linkedinUrl && (
                <Row label="LinkedIn" value={
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:underline text-xs truncate max-w-[200px] inline-block">
                    {user.linkedinUrl.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                  </a>
                } />
              )}
              <Row label="Membre depuis" value={fmtDate(user.createdAt)} />
              <Row label="ID" value={user.id} mono />
            </div>
          </div>

          {/* Professional */}
          {(user.currentPosition || user.activitySector) && (
            <div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Parcours professionnel</p>
              <Row label="Poste" value={user.currentPosition} />
              <Row label="Secteur" value={user.activitySector} />
              <Row label="Ancienneté" value={user.positionDuration ? posDur[user.positionDuration] || user.positionDuration : null} />
              {user.careerPath && <Row label="Parcours" value={<span className="text-xs leading-relaxed">{user.careerPath}</span>} />}
              {user.interests && Array.isArray(user.interests) && user.interests.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-neutral-500">Intérêts</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.interests.map((i, idx) => (
                      <span key={idx} className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[10px]">{i}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription */}
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Abonnement</p>
            <Row label="Type" value={user.subscriptionType === 'unlimited' ? 'Illimitée' : user.subscriptionType === 'event_based' ? 'Événementielle' : '—'} />
            <Row label="Statut" value={user.subscriptionStatus === 'ACTIVE' ? 'Actif' : user.subscriptionStatus === 'EXPIRED' ? 'Expiré' : '—'} />
            <Row label="Prix" value={fmtPrice(user.subscriptionPriceCents)} />
            <Row label="Période" value={user.subscriptionStartDate ? `${fmtDate(user.subscriptionStartDate)} → ${fmtDate(user.subscriptionEndDate)}` : '—'} />
            {user.stripeCustomerId && <Row label="Stripe Customer" value={user.stripeCustomerId} mono />}
            {user.stripeSubscriptionId && <Row label="Stripe Sub" value={user.stripeSubscriptionId} mono />}
          </div>

          {/* Create subscription */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Créer un abonnement</p>
              {!showSubForm && (
                <button onClick={() => setShowSubForm(true)} className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium">
                  Créer manuellement
                </button>
              )}
            </div>
            {showSubForm && (
              <div className="bg-neutral-50 rounded-lg p-3 space-y-2.5 border border-neutral-200">
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as 'event_based' | 'unlimited')}
                  className="w-full h-8 px-2.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-neutral-400"
                >
                  <option value="event_based">Événementielle</option>
                  <option value="unlimited">Illimitée</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 px-2.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-neutral-400" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 px-2.5 text-xs border border-neutral-200 rounded-md bg-white focus:outline-none focus:border-neutral-400" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={resetForm} disabled={isSubmitting}
                    className="px-3 py-1.5 text-[11px] text-neutral-600 hover:bg-neutral-100 rounded-md font-medium">Annuler</button>
                  <button onClick={handleCreateSub} disabled={isSubmitting || !startDate || !endDate}
                    className="px-3 py-1.5 text-[11px] text-white bg-brand rounded-md hover:bg-brand-dark font-medium disabled:opacity-40 flex items-center gap-1">
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Créer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
