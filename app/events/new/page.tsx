'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { eventsApi, Event } from '@/lib/api';
import { eventSchema } from '@/lib/validations';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

const INITIAL_FORM_DATA: Partial<Event> = {
  title: '',
  subtitle: '',
  slug: '',
  categoryTag: '',
  eventType: 'PHYSICAL',
  webinarUrl: '',
  presenterName: '',
  organizerName: '',
  organizerUrl: '',
  startsAt: '',
  endsAt: '',
  timezone: 'Europe/Paris',
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
  externalBookingUrl: '',
  maxParticipants: null,
  limitedThreshold: null,
  coverImageUrl: '',
  descriptionHtml: '',
  status: 'scheduled',
  publicationStatus: 'draft',
};

const inputClass = 'w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-400';
const inputReadOnlyClass = `${inputClass} bg-neutral-50`;
const labelClass = 'block text-xs font-medium text-neutral-600 mb-1';
const sectionTitleClass = 'text-xs font-semibold text-neutral-700 uppercase tracking-wider';

function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Event>>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = generateSlugFromTitle(formData.title);
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const dataToValidate = {
      title: formData.title || '',
      slug: formData.slug || '',
      subtitle: formData.subtitle || null,
      categoryTag: formData.categoryTag || '',
      eventType: formData.eventType || 'PHYSICAL',
      webinarUrl: formData.webinarUrl || null,
      startsAt: formData.startsAt || null,
      endsAt: formData.endsAt || null,
      venueName: formData.venueName || null,
      fullAddress: formData.fullAddress || null,
      minPriceCents: formData.minPriceCents || null,
      maxParticipants: formData.maxParticipants || null,
      limitedThreshold: formData.limitedThreshold || null,
      coverImageUrl: formData.coverImageUrl || null,
      descriptionHtml: formData.descriptionHtml || null,
      publicationStatus: formData.publicationStatus,
      status: formData.status,
    };

    const result = eventSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const dataToSubmit = {
        ...formData,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      };
      await eventsApi.create(dataToSubmit);
      toast.success('Evenement cree');
      router.push('/events');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <h1 className="text-base font-semibold text-neutral-900">Creer un evenement</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Erreurs de validation</h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.entries(validationErrors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Informations */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
            <h3 className={sectionTitleClass}>Informations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Titre *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className={`${inputClass} ${validationErrors.title ? '!border-red-500' : ''}`}
                  placeholder="Nom de l'evenement"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Sous-titre</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Description courte"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Slug * (URL de l&apos;evenement)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    required
                    pattern="[a-z0-9-]+"
                    className={`flex-1 font-mono ${inputClass}`}
                    placeholder="mon-evenement-2024"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, slug: generateSlugFromTitle(prev.title ?? '') }))}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors text-xs font-medium"
                  >
                    Generer
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Categorie *</label>
                <select
                  name="categoryTag"
                  value={formData.categoryTag ?? ''}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">-- Selectionnez une categorie --</option>
                  <option value="afterworks">Afterworks</option>
                  <option value="masterclass">Masterclass</option>
                  <option value="partage-entrepreneurs">Partage d&apos;Entrepreneurs</option>
                  <option value="workshop">Workshop</option>
                  <option value="conference">Conference</option>
                  <option value="evenements-annuels">Evenements Annuels</option>
                  <option value="evenements-co-organises">Evenements Co-organises</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Type d&apos;evenement *</label>
                <select
                  name="eventType"
                  value={formData.eventType ?? 'PHYSICAL'}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="PHYSICAL">Evenement physique</option>
                  <option value="WEBINAR">Webinar en ligne</option>
                </select>
              </div>

              {formData.eventType === 'WEBINAR' && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Lien du webinar *</label>
                  <input
                    type="url"
                    name="webinarUrl"
                    value={formData.webinarUrl ?? ''}
                    onChange={handleChange}
                    required={formData.eventType === 'WEBINAR'}
                    className={inputClass}
                    placeholder="https://zoom.us/j/123456789"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className={labelClass}>Statut de publication</label>
                <select
                  name="publicationStatus"
                  value={formData.publicationStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="online">En ligne (visible)</option>
                  <option value="draft">Brouillon (non visible)</option>
                  <option value="offline">Hors ligne (archive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Dates */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
            <h3 className={sectionTitleClass}>Dates</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date de debut</label>
                <input
                  type="datetime-local"
                  name="startsAt"
                  value={formData.startsAt ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Date de fin</label>
                <input
                  type="datetime-local"
                  name="endsAt"
                  value={formData.endsAt ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone ?? 'Europe/Paris'}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Lieu (only for physical events) */}
          {formData.eventType !== 'WEBINAR' && (
            <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
              <h3 className={sectionTitleClass}>Lieu</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nom du lieu</label>
                  <input
                    type="text"
                    name="venueName"
                    value={formData.venueName ?? ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Station F, Salle Pleyel..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Rechercher une adresse</label>
                  <AddressAutocomplete
                    defaultValue={formData.fullAddress ?? ''}
                    onAddressSelect={(addressData) => {
                      setFormData(prev => ({
                        ...prev,
                        addressLine1: addressData.addressLine1,
                        postalCode: addressData.postalCode,
                        city: addressData.city,
                        region: addressData.region,
                        country: addressData.country,
                        fullAddress: addressData.fullAddress,
                        latitude: addressData.latitude,
                        longitude: addressData.longitude,
                      }));
                    }}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Les champs ci-dessous seront remplis automatiquement
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Adresse</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1 ?? ''}
                    onChange={handleChange}
                    className={inputReadOnlyClass}
                    placeholder="Auto-rempli"
                    readOnly
                  />
                </div>

                <div>
                  <label className={labelClass}>Code postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode ?? ''}
                    onChange={handleChange}
                    className={inputReadOnlyClass}
                    placeholder="Auto-rempli"
                    readOnly
                  />
                </div>

                <div>
                  <label className={labelClass}>Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city ?? ''}
                    onChange={handleChange}
                    className={inputReadOnlyClass}
                    placeholder="Auto-rempli"
                    readOnly
                  />
                </div>

                <div>
                  <label className={labelClass}>Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region ?? ''}
                    onChange={handleChange}
                    className={inputReadOnlyClass}
                    placeholder="Auto-rempli"
                    readOnly
                  />
                </div>

                <div>
                  <label className={labelClass}>Pays</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country ?? ''}
                    onChange={handleChange}
                    className={inputReadOnlyClass}
                    placeholder="Auto-rempli"
                    readOnly
                  />
                </div>

                <div>
                  <label className={labelClass}>Adresse complete</label>
                  <input
                    type="text"
                    name="fullAddress"
                    value={formData.fullAddress ?? ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="5 Parvis Alan Turing, 75013 Paris"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Organisateurs */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
            <h3 className={sectionTitleClass}>Organisateurs</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Presentateur</label>
                <input
                  type="text"
                  name="presenterName"
                  value={formData.presenterName ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nom du presentateur"
                />
              </div>

              <div>
                <label className={labelClass}>Organisateur</label>
                <input
                  type="text"
                  name="organizerName"
                  value={formData.organizerName ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nom de l'organisateur"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Site web de l&apos;organisateur</label>
                <input
                  type="url"
                  name="organizerUrl"
                  value={formData.organizerUrl ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tarification */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
            <h3 className={sectionTitleClass}>Tarification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prix minimum (en euros)</label>
                <input
                  type="number"
                  name="minPriceCents"
                  value={formData.minPriceCents ? formData.minPriceCents / 100 : 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, minPriceCents: parseFloat(e.target.value) * 100 }))}
                  step="0.01"
                  min="0"
                  className={inputClass}
                  placeholder="25.00"
                />
                <p className="text-xs text-neutral-500 mt-1">Prix converti automatiquement en centimes</p>
              </div>

              <div>
                <label className={labelClass}>Devise</label>
                <select
                  name="currency"
                  value={formData.currency ?? 'EUR'}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>URL de reservation externe</label>
                <input
                  type="url"
                  name="externalBookingUrl"
                  value={formData.externalBookingUrl ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://billetterie.example.com"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Laissez vide si la reservation se fait sur votre plateforme
                </p>
              </div>

              <div>
                <label className={labelClass}>Nombre maximum de participants</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Laissez vide pour illimite"
                  value={formData.maxParticipants ?? ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    maxParticipants: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className={inputClass}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Laissez vide pour un evenement sans limite de places
                </p>
              </div>

              <div>
                <label className={labelClass}>Seuil Places limitees</label>
                <input
                  type="number"
                  min="1"
                  placeholder="5 par defaut"
                  value={formData.limitedThreshold ?? ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    limitedThreshold: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  className={inputClass}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Affiche Places limitees quand il reste moins de X places
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Contenu */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
            <h3 className={sectionTitleClass}>Contenu</h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Description de l&apos;evenement</label>
                <RichTextEditor
                  value={formData.descriptionHtml ?? ''}
                  onChange={(html: string) => setFormData(prev => ({ ...prev, descriptionHtml: html }))}
                  placeholder="Decrivez l'evenement en detail..."
                />
              </div>

              <div>
                <label className={labelClass}>URL de l&apos;image de couverture</label>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.coverImageUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.coverImageUrl}
                      alt="Apercu"
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

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link
              href="/events"
              className="px-4 py-1.5 text-sm border border-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-sm bg-brand hover:bg-brand-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Creer l&apos;evenement</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
