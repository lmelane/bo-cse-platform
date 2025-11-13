/**
 * Utilitaires pour l'export CSV sécurisé
 */

/**
 * Échappe une cellule CSV pour prévenir les injections de formules Excel
 * et les problèmes d'encodage
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  
  // Échapper les formules Excel potentiellement dangereuses
  // Les formules commencent par =, +, -, @ ou |
  const dangerousChars = ['=', '+', '-', '@', '|', '\t', '\r'];
  const startsWithDangerousChar = dangerousChars.some(char => str.startsWith(char));
  
  if (startsWithDangerousChar) {
    // Préfixer avec une apostrophe pour neutraliser la formule
    return `"'${str.replace(/"/g, '""')}"`;
  }
  
  // Échapper les guillemets doubles standard
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Convertit un tableau de données en contenu CSV sécurisé
 */
export function generateCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escapedHeaders = headers.map(h => escapeCSVCell(h));
  const escapedRows = rows.map(row => 
    row.map(cell => escapeCSVCell(cell)).join(',')
  );
  
  return [
    escapedHeaders.join(','),
    ...escapedRows
  ].join('\n');
}

/**
 * Télécharge un fichier CSV
 */
export function downloadCSV(filename: string, content: string): void {
  // Ajouter le BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer la mémoire
  URL.revokeObjectURL(url);
}

/**
 * Génère et télécharge un CSV sécurisé
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  const csvContent = generateCSV(headers, rows);
  downloadCSV(filename, csvContent);
}
