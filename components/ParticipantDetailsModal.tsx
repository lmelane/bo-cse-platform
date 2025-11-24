'use client';

import React from 'react';
import { X, User, Mail, Calendar, MapPin, DollarSign, CheckCircle, Clock, UserPlus, QrCode } from 'lucide-react';
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
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Détails du participant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type de participant */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              participant.type === 'booking' 
                ? 'bg-brand/10 text-brand' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {participant.type === 'booking' ? (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Adhérent
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invité
                </>
              )}
            </span>
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              participant.presenceStatus === 'PRESENT'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <QrCode className="w-4 h-4 mr-2" />
              {participant.presenceStatus === 'PRESENT' ? 'Présent' : 'Absent'}
            </span>
          </div>

          {/* Informations personnelles */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand" />
              Informations personnelles
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-neutral-600">Nom complet</span>
                <p className="font-medium text-neutral-900">
                  {participant.firstName} {participant.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-neutral-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
                <p className="font-medium text-neutral-900">{participant.email}</p>
              </div>
              {participant.association && (
                <div>
                  <span className="text-sm text-neutral-600">Association</span>
                  <p className="font-medium text-neutral-900">{participant.association}</p>
                </div>
              )}
              {participant.referredBy && (
                <div>
                  <span className="text-sm text-neutral-600">Invité par</span>
                  <p className="font-medium text-purple-700">{participant.referredBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Événement */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              Événement
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-neutral-600">Titre</span>
                <p className="font-medium text-neutral-900">{participant.eventTitle}</p>
              </div>
              {participant.eventDate && (
                <div>
                  <span className="text-sm text-neutral-600">Date</span>
                  <p className="font-medium text-neutral-900">{formatDate(participant.eventDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Réservation & Paiement */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand" />
              Réservation & Paiement
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Statut paiement</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  participant.isPaid
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {participant.isPaid ? 'Payé' : 'Gratuit'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Montant</span>
                <p className="font-medium text-neutral-900">{formatPrice(participant.totalPriceCents)}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Nombre de places</span>
                <p className="font-medium text-neutral-900">{participant.totalPlaces}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Statut</span>
                <p className="font-medium text-neutral-900">{participant.status}</p>
              </div>
            </div>
          </div>

          {/* Présence (QR Code) */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand" />
              Contrôle de présence
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Statut</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  participant.presenceStatus === 'PRESENT'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {participant.presenceStatus === 'PRESENT' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Présent
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Non scanné
                    </>
                  )}
                </span>
              </div>
              {participant.scannedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Scanné le</span>
                  <p className="font-medium text-green-700">{formatDate(participant.scannedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              Dates
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Inscription</span>
                <p className="font-medium text-neutral-900">{formatDate(participant.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
