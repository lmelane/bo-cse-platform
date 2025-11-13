import { z } from 'zod';

/**
 * Schémas de validation Zod pour les opérations critiques
 */

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
