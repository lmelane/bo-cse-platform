import { z } from 'zod';

/**
 * Schémas de validation Zod pour les opérations critiques
 */

// Validation création/modification d'événement
export const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200, 'Le titre est trop long'),
  slug: z.string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(100, 'Le slug est trop long')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  subtitle: z.string().max(300, 'Le sous-titre est trop long').optional().nullable(),
  categoryTag: z.string().min(1, 'La catégorie est requise'),
  eventType: z.enum(['PHYSICAL', 'WEBINAR'], { message: 'Type d\'événement invalide' }),
  webinarUrl: z.string().url('URL du webinar invalide').optional().nullable()
    .refine((val) => val === null || val === '' || val === undefined || z.string().url().safeParse(val).success, {
      message: 'URL du webinar invalide',
    }),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  venueName: z.string().max(200, 'Nom du lieu trop long').optional().nullable(),
  fullAddress: z.string().max(500, 'Adresse trop longue').optional().nullable(),
  minPriceCents: z.number().min(0, 'Le prix ne peut pas être négatif').optional().nullable(),
  maxParticipants: z.number().int().min(1, 'Le nombre de participants doit être au moins 1').optional().nullable(),
  limitedThreshold: z.number().int().min(1, 'Le seuil doit être au moins 1').optional().nullable(),
  coverImageUrl: z.string().url('URL de l\'image invalide').optional().nullable()
    .refine((val) => val === null || val === '' || val === undefined || z.string().url().safeParse(val).success, {
      message: 'URL de l\'image invalide',
    }),
  descriptionHtml: z.string().max(50000, 'Description trop longue').optional().nullable(),
  publicationStatus: z.enum(['online', 'draft', 'offline']).optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
}).refine((data) => {
  // Si c'est un webinar, l'URL est requise
  if (data.eventType === 'WEBINAR' && (!data.webinarUrl || data.webinarUrl.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'L\'URL du webinar est requise pour les événements en ligne',
  path: ['webinarUrl'],
}).refine((data) => {
  // Vérifier que la date de fin est après la date de début
  if (data.startsAt && data.endsAt) {
    return new Date(data.endsAt) > new Date(data.startsAt);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endsAt'],
});

export type EventInput = z.infer<typeof eventSchema>;

// Validation changement de rôle
export const updateRoleSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  role: z.enum(['user', 'admin'], {
    message: 'Le rôle doit être "user" ou "admin"',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// Validation filtre utilisateurs
export const userFiltersSchema = z.object({
  searchTerm: z.string().max(100, 'Recherche trop longue').optional(),
  filterType: z.enum(['all', 'event_based', 'unlimited']).optional(),
  filterStatus: z.enum(['all', 'ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
});

export type UserFiltersInput = z.infer<typeof userFiltersSchema>;

// Validation pagination
export const paginationSchema = z.object({
  page: z.number().int().positive('La page doit être positive'),
  limit: z.number().int().min(1).max(100, 'Limite maximum: 100 éléments'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Validation export CSV
export const csvExportSchema = z.object({
  filename: z.string().min(1, 'Nom de fichier requis').max(255),
  rowCount: z.number().int().min(0).max(100000, 'Export trop volumineux (max 100k lignes)'),
});

export type CsvExportInput = z.infer<typeof csvExportSchema>;

// Helper pour valider et retourner des erreurs friendly
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Validation échouée: ${message}`);
    }
    throw error;
  }
}

// Helper pour valider sans throw (retourne undefined si invalide)
export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}
