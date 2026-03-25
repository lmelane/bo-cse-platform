'use client';

import React from 'react';
import { X, User, Mail, Calendar, DollarSign, CheckCircle, Clock, UserPlus, QrCode } from 'lucide-react';
import { GlobalParticipant } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ParticipantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: GlobalParticipant | null;
}

export default function ParticipantDetailsModal({
  isOpen,
  onClose,
  participant,
}: ParticipantDetailsModalProps) {
  if (!isOpen || !participant) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Détails du participant</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type de participant */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${participant.type === 'booking'
                ? 'bg-brand/5 text-brand'
                : 'bg-purple-50 text-purple-700'
              }`}>
              {participant.type === 'booking' ? (
                <>
                  <User className="w-3 h-3 mr-1" />
                  Adhérent
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" />
                  Invité
                </>
              )}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${participant.presenceStatus === 'PRESENT'
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-600'
              }`}>
              <QrCode className="w-3 h-3 mr-1" />
              {participant.presenceStatus === 'PRESENT' ? 'Présent' : 'Absent'}
            </span>
          </div>

          {/* Informations personnelles */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand" />
              Informations personnelles
            </h3>
            <div className="bg-neutral-50 rounded-md p-3 space-y-2">
              <div>
                <span className="text-[11px] text-neutral-500">Nom complet</span>
                <p className="text-sm font-medium text-neutral-900">
                  {participant.firstName} {participant.lastName}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </span>
                <p className="text-sm font-medium text-neutral-900">{participant.email}</p>
              </div>
              {participant.association && (
                <div>
                  <span className="text-[11px] text-neutral-500">Association</span>
                  <p className="text-sm font-medium text-neutral-900">{participant.association}</p>
                </div>
              )}
              {participant.referredBy && (
                <div>
                  <span className="text-[11px] text-neutral-500">Invité par</span>
                  <p className="text-sm font-medium text-purple-700">{participant.referredBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Événement */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              Événement
            </h3>
            <div className="bg-neutral-50 rounded-md p-3 space-y-2">
              <div>
                <span className="text-[11px] text-neutral-500">Titre</span>
                <p className="text-sm font-medium text-neutral-900">{participant.eventTitle}</p>
              </div>
              {participant.eventDate && (
                <div>
                  <span className="text-[11px] text-neutral-500">Date</span>
                  <p className="text-sm font-medium text-neutral-900">{formatDate(participant.eventDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Réservation & Paiement */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-brand" />
              Réservation & Paiement
            </h3>
            <div className="bg-neutral-50 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Statut paiement</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${participant.isPaid
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                  }`}>
                  {participant.isPaid ? 'Payé' : 'Gratuit'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Montant</span>
                <p className="text-sm font-medium text-neutral-900">{formatPrice(participant.totalPriceCents)}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Nombre de places</span>
                <p className="text-sm font-medium text-neutral-900">{participant.totalPlaces}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Statut</span>
                <p className="text-sm font-medium text-neutral-900">{participant.status}</p>
              </div>
            </div>
          </div>

          {/* Présence (QR Code) */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-brand" />
              Contrôle de présence
            </h3>
            <div className="bg-neutral-50 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Statut</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${participant.presenceStatus === 'PRESENT'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {participant.presenceStatus === 'PRESENT' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Présent
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Non scanné
                    </>
                  )}
                </span>
              </div>
              {participant.scannedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Scanné le</span>
                  <p className="text-sm font-medium text-green-700">{formatDate(participant.scannedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              Dates
            </h3>
            <div className="bg-neutral-50 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Inscription</span>
                <p className="text-sm font-medium text-neutral-900">{formatDate(participant.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
