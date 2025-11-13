'use client';

import { X, User, Calendar, Euro, CreditCard, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GlobalParticipant } from '@/lib/api';

interface ParticipantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: GlobalParticipant | null;
}

export default function ParticipantDetailsModal({ isOpen, onClose, participant }: ParticipantDetailsModalProps) {
  if (!isOpen || !participant) return null;

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-700',
        iconColor: 'text-yellow-600'
      },
      validated: { 
        label: 'Validé', 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-700',
        iconColor: 'text-green-600'
      },
      refused: { 
        label: 'Refusé', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-700',
        iconColor: 'text-red-600'
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Détails de la réservation</h2>
            <p className="text-sm text-neutral-600 mt-1">#{participant.bookingId.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informations de l'événement */}
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-brand" />
              <h3 className="font-semibold text-neutral-900">Événement</h3>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-neutral-900">{participant.event.title}</p>
              {participant.event.startsAt && (
                <p className="text-sm text-neutral-600">
                  📅 {formatDate(participant.event.startsAt)}
                </p>
              )}
              {(participant.event.venueName || participant.event.city) && (
                <p className="text-sm text-neutral-600">
                  📍 {participant.event.venueName}
                  {participant.event.city && ` - ${participant.event.city}`}
                </p>
              )}
            </div>
          </div>

          {/* Informations du titulaire */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-neutral-700" />
              <h3 className="font-semibold text-neutral-900">Titulaire de la réservation</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Nom complet</span>
                <span className="text-sm font-medium text-neutral-900">
                  {participant.holder.firstName} {participant.holder.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Email</span>
                <span className="text-sm font-medium text-neutral-900">{participant.holder.email}</span>
              </div>
              {participant.holder.association && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Association</span>
                  <span className="text-sm font-medium text-neutral-900">{participant.holder.association}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informations de paiement */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-neutral-700" />
              <h3 className="font-semibold text-neutral-900">Paiement</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Montant total</span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(participant.totalPriceCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Statut</span>
                {participant.isPaid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Payé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3" />
                    Non payé
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Nombre de places</span>
                <span className="text-sm font-medium text-neutral-900">{participant.totalPlaces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Date de réservation</span>
                <span className="text-sm font-medium text-neutral-900">{formatDate(participant.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Liste des invités */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-neutral-700" />
              <h3 className="font-semibold text-neutral-900">
                Invités ({participant.guests.length})
              </h3>
            </div>
            
            {participant.guests.length > 0 ? (
              <div className="space-y-3">
                {participant.guests.map((guest) => {
                  const statusConfig = getStatusConfig(guest.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div 
                      key={guest.id} 
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">
                          {guest.firstName} {guest.lastName}
                        </p>
                        <p className="text-sm text-neutral-600">{guest.email}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Ajouté le {format(new Date(guest.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Aucun invité pour cette réservation</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
