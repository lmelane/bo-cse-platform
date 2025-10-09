'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '@/lib/api';
import { X, Loader2, Calendar, MapPin, Tag, Image as ImageIcon } from 'lucide-react';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Event>) => Promise<void>;
  event?: Event | null;
  isLoading?: boolean;
}

export default function EventFormModal({ isOpen, onClose, onSubmit, event, isLoading }: EventFormModalProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    // Informations principales
    title: '',
    subtitle: '',
    slug: '',
    categoryTag: '',
    
    // Intervenants
    presenterName: '',
    organizerName: '',
    
    // Dates et horaires
    startsAt: '',
    endsAt: '',
    
    // Localisation
    venueName: '',
    addressLine1: '',
    postalCode: '',
    city: '',
    region: '',
    country: '',
    fullAddress: '',
    latitude: null,
    longitude: null,
    
    // Tarification
    minPriceCents: 0,
    ticketStatus: 'available',
    externalBookingUrl: '',
    
    // Médias
    coverImageUrl: '',
    
    // Contenu
    descriptionHtml: '',
    
    // Statut
    status: 'scheduled',
    publicationStatus: 'draft',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        // Informations principales
        title: event.title ?? '',
        subtitle: event.subtitle ?? '',
        slug: event.slug ?? '',
        categoryTag: event.categoryTag ?? '',
        
        // Intervenants
        presenterName: event.presenterName ?? '',
        organizerName: event.organizerName ?? '',
        
        // Dates et horaires
        startsAt: event.startsAt ?? '',
        endsAt: event.endsAt ?? '',
        
        // Localisation
        venueName: event.venueName ?? '',
        addressLine1: event.addressLine1 ?? '',
        postalCode: event.postalCode ?? '',
        city: event.city ?? '',
        region: event.region ?? '',
        country: event.country ?? '',
        fullAddress: event.fullAddress ?? '',
        latitude: event.latitude,
        longitude: event.longitude,
        
        // Tarification
        minPriceCents: event.minPriceCents ?? 0,
        currency: event.currency ?? 'EUR',
        ticketStatus: event.ticketStatus ?? 'available',
        externalBookingUrl: event.externalBookingUrl ?? '',
        
        // Médias
        coverImageUrl: event.coverImageUrl ?? '',
        
        // Contenu
        descriptionHtml: event.descriptionHtml ?? '',
        
        // Statut
        status: event.status ?? 'scheduled',
        publicationStatus: event.publicationStatus ?? 'draft',
      });
    } else {
      // Reset form pour création
      setFormData({
        title: '',
        subtitle: '',
        slug: '',
        categoryTag: '',
        presenterName: '',
        organizerName: '',
        startsAt: '',
        endsAt: '',
        venueName: '',
        addressLine1: '',
        postalCode: '',
        city: '',
        region: '',
        country: '',
        fullAddress: '',
        latitude: null,
        longitude: null,
        minPriceCents: 0,
        currency: 'EUR',
        ticketStatus: 'available',
        externalBookingUrl: '',
        coverImageUrl: '',
        descriptionHtml: '',
        status: 'scheduled',
        publicationStatus: 'draft',
      });
    }
  }, [event, isOpen]);

  // Auto-génération du slug depuis le titre (sauf si modifié manuellement)
  useEffect(() => {
    if (!event && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler spécifique pour le slug avec formatage automatique
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9-]/g, '-')      // Remplacer caractères invalides par -
      .replace(/-+/g, '-')              // Remplacer multiple - par un seul
      .replace(/^-|-$/g, '');           // Supprimer - au début/fin
    
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Générer le slug depuis le titre
  const generateSlug = () => {
    const slug = formData.title
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">
            {event ? 'Modifier l\'événement' : 'Créer un événement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Informations principales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Informations principales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Nom de l'événement"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Description courte"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Slug * (URL de l&apos;événement)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      required
                      pattern="[a-z0-9-]+"
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent font-mono text-sm"
                      placeholder="mon-evenement-2024"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Générer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="categoryTag"
                    value={formData.categoryTag ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Sport, Culture, Loisirs..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Statut de l&apos;événement
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="scheduled">Planifié</option>
                    <option value="ongoing">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Statut de publication
                  </label>
                  <select
                    name="publicationStatus"
                    value={formData.publicationStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="online">En ligne (visible)</option>
                    <option value="draft">Brouillon (non visible)</option>
                    <option value="offline">Hors ligne (archivé)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates et horaires
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    value={formData.startsAt ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={formData.endsAt ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localisation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nom du lieu
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    value={formData.venueName ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Station F, Salle Pleyel..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1 ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="5 Parvis Alan Turing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="75013"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Région
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Île-de-France"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="France"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Adresse complète (format texte)
                  </label>
                  <input
                    type="text"
                    name="fullAddress"
                    value={formData.fullAddress ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="5 Parvis Alan Turing, 75013 Paris"
                  />
                </div>
              </div>
            </div>

            {/* Organisateurs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900">Organisateurs</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Présentateur
                  </label>
                  <input
                    type="text"
                    name="presenterName"
                    value={formData.presenterName ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Nom du présentateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Organisateur
                  </label>
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Nom de l'organisateur"
                  />
                </div>

              </div>
            </div>

            {/* Tarification */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900">Tarification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Prix minimum (en €)
                  </label>
                  <input
                    type="number"
                    name="minPriceCents"
                    value={formData.minPriceCents ? formData.minPriceCents / 100 : 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, minPriceCents: parseFloat(e.target.value) * 100 }))}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="25.00"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Prix converti automatiquement en centimes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Devise
                  </label>
                  <select
                    name="currency"
                    value={formData.currency ?? 'EUR'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Statut des billets
                  </label>
                  <select
                    name="ticketStatus"
                    value={formData.ticketStatus ?? 'available'}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="available">Disponible</option>
                    <option value="limited">Places limitées</option>
                    <option value="sold_out">Complet</option>
                    <option value="unknown">Inconnu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    URL de réservation externe
                  </label>
                  <input
                    type="url"
                    name="externalBookingUrl"
                    value={formData.externalBookingUrl ?? ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="https://billetterie.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900">Description de l&apos;événement</h3>
              
              <div>
                <RichTextEditor
                  value={formData.descriptionHtml ?? ''}
                  onChange={(html) => setFormData(prev => ({ ...prev, descriptionHtml: html }))}
                  placeholder="Décrivez l'événement en détail..."
                />
              </div>
            </div>

            {/* Image */}
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Médias
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  URL de l&apos;image de couverture
                </label>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl ?? ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.coverImageUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.coverImageUrl}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{event ? 'Mettre à jour' : 'Créer l\'événement'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
