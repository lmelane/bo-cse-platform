# 📚 API Management CSE - Référence Complète

Documentation basée sur les tests réels de l'API en production.

**URL API** : `https://cse-plateform.vercel.app`

---

## 🔐 Authentification

### POST /api/auth/login

Obtenir un token JWT admin.

**Request:**
```json
{
  "email": "admin@cse.com",
  "password": "Admin123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "2ae9e841-4161-4595-97d0-720bd092adfb",
    "email": "admin@cse.com",
    "firstName": "Admin",
    "lastName": "CSE",
    "association": "Administration",
    "role": "admin",
    "onboardingCompleted": true,
    "createdAt": "2025-10-09T07:13:11.595Z"
  }
}
```

**Utiliser le token** dans toutes les requêtes suivantes :
```
Authorization: Bearer <token>
```

---

## 👥 Users Management

### GET /api/mgnt-sys-cse/users

Liste tous les utilisateurs.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "2ae9e841-4161-4595-97d0-720bd092adfb",
      "email": "admin@cse.com",
      "firstName": "Admin",
      "lastName": "CSE",
      "association": "Administration",
      "role": "admin",
      "onboardingCompleted": true,
      "createdAt": "2025-10-09T07:13:11.595Z",
      "updatedAt": "2025-10-09T07:13:11.595Z"
    },
    {
      "id": "c7bad693-e416-48c0-b16f-096fd36db072",
      "email": "loic.melane@gmail.com",
      "firstName": "Loic",
      "lastName": "MELANE",
      "association": "Centrale Marseille",
      "role": "user",
      "onboardingCompleted": true,
      "createdAt": "2025-10-08T08:56:41.047Z",
      "updatedAt": "2025-10-09T10:03:51.378Z"
    }
  ]
}
```

### PATCH /api/mgnt-sys-cse/users/:id/role

Change le rôle d'un utilisateur.

**Request:**
```json
{
  "role": "admin"  // ou "user"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Rôle changé en 'admin'",
  "data": { /* User object */ }
}
```

---

## 📅 Events Management

### Structure complète d'un Event

Basé sur les données réelles de l'API :

```typescript
interface Event {
  // Identifiants
  id: string;                          // UUID
  slug: string;                        // URL-friendly unique
  
  // Informations principales
  title: string;                       // Titre de l'événement
  subtitle: string | null;             // Sous-titre
  categoryTag: string | null;          // Ex: "afterworks", "masterclass"
  availabilityBadge: string | null;    // Ex: "Places limitées", "Gratuit"
  
  // Intervenants
  presenterName: string | null;        // Nom du présentateur
  organizerName: string | null;        // Nom de l'organisateur
  organizerUrl: string | null;         // URL de l'organisateur
  
  // Dates et horaires
  startsAt: string | null;             // ISO 8601 datetime
  endsAt: string | null;               // ISO 8601 datetime
  timezone: string | null;             // Ex: "Europe/Paris"
  rawDatetimeLabel: string | null;     // Label texte libre
  
  // Localisation
  venueName: string | null;            // Nom du lieu
  addressLine1: string | null;         // Adresse ligne 1
  postalCode: string | null;           // Code postal
  city: string | null;                 // Ville
  region: string | null;               // Région
  country: string | null;              // Pays
  fullAddress: string | null;          // Adresse complète
  latitude: number | null;             // Coordonnées GPS
  longitude: number | null;            // Coordonnées GPS
  
  // Tarification
  minPriceCents: number | null;        // Prix minimum en centimes
  currency: string | null;             // Code devise (EUR, USD...)
  ticketStatus: string | null;         // "available", "limited", "sold_out"
  externalBookingUrl: string | null;   // URL de réservation externe
  
  // Médias
  coverImageUrl: string | null;        // URL image de couverture
  galleryUrls: string[];               // URLs des images de galerie
  
  // Contenu
  descriptionHtml: string | null;      // Description HTML
  infoPratiquesJson: object | null;    // Infos pratiques (JSON)
  policyJson: object | null;           // Politique (JSON)
  
  // Statut
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  source: string | null;               // Source des données
  
  // Timestamps
  createdAt: string;                   // ISO 8601 datetime
  updatedAt: string;                   // ISO 8601 datetime
}
```

### GET /api/mgnt-sys-cse/events

Liste tous les événements.

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [ /* Array of Event objects */ ]
}
```

**Exemple d'événement réel :**
```json
{
  "id": "ee8e3121-4748-4b0c-aea6-b9436982ba40",
  "title": "Afterwork Startup - Pitch & Networking",
  "subtitle": "Présentez votre startup en 3 minutes",
  "slug": "afterwork-startup-pitch-networking",
  "categoryTag": "afterworks",
  "availabilityBadge": "Gratuit",
  "presenterName": "Marie Martin",
  "organizerName": "CSE CentraleSupélec",
  "organizerUrl": null,
  "startsAt": "2025-11-22T18:00:00.000Z",
  "endsAt": "2025-11-22T21:00:00.000Z",
  "timezone": "Europe/Paris",
  "rawDatetimeLabel": "Vendredi 22 novembre à 19h00",
  "venueName": "Station F",
  "addressLine1": "5 Parvis Alan Turing",
  "postalCode": "75013",
  "city": "Paris",
  "region": "Île-de-France",
  "country": "France",
  "fullAddress": "5 Parvis Alan Turing, 75013 Paris",
  "latitude": null,
  "longitude": null,
  "minPriceCents": 0,
  "currency": "EUR",
  "ticketStatus": "available",
  "externalBookingUrl": null,
  "coverImageUrl": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
  "galleryUrls": [],
  "descriptionHtml": "<p>Pitch your startup and meet potential co-founders!</p>",
  "infoPratiquesJson": null,
  "policyJson": null,
  "status": "scheduled",
  "source": null,
  "createdAt": "2025-10-08T06:39:32.288Z",
  "updatedAt": "2025-10-08T06:39:32.288Z"
}
```

### GET /api/mgnt-sys-cse/events/:id

Récupère un événement par ID.

**Response 200:**
```json
{
  "success": true,
  "data": { /* Event object */ }
}
```

### POST /api/mgnt-sys-cse/events

Crée un nouvel événement.

**⚠️ IMPORTANT: Format snake_case requis pour l'API**

**Request (minimum requis):**
```json
{
  "title": "Mon événement",
  "slug": "mon-evenement"
}
```

**Request (complet):**
```json
{
  "title": "Afterwork Innovation",
  "subtitle": "Networking et échanges",
  "slug": "afterwork-innovation-dec-2025",
  "category_tag": "afterworks",
  "availability_badge": "Places limitées",
  "presenter_name": "Jean Dupont",
  "organizer_name": "CSE CentraleSupélec",
  "organizer_url": null,
  "starts_at": "2025-12-15T18:00:00.000Z",
  "ends_at": "2025-12-15T21:00:00.000Z",
  "timezone": "Europe/Paris",
  "raw_datetime_label": "Lundi 15 décembre à 19h00",
  "venue_name": "Station F",
  "address_line1": "5 Parvis Alan Turing",
  "postal_code": "75013",
  "city": "Paris",
  "region": "Île-de-France",
  "country": "France",
  "full_address": "5 Parvis Alan Turing, 75013 Paris",
  "latitude": null,
  "longitude": null,
  "min_price_cents": 0,
  "currency": "EUR",
  "ticket_status": "available",
  "external_booking_url": null,
  "cover_image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
  "gallery_urls": [],
  "description_html": "<p>Rejoignez-nous !</p>",
  "info_pratiques_json": null,
  "policy_json": null,
  "status": "scheduled",
  "source": null
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Événement créé avec succès",
  "data": { /* Event object créé */ }
}
```

### PUT /api/mgnt-sys-cse/events/:id

Met à jour un événement existant.

**Request:** Même format que POST (tous les champs optionnels sauf title et slug)

**Response 200:**
```json
{
  "success": true,
  "message": "Événement mis à jour avec succès",
  "data": { /* Event object mis à jour */ }
}
```

### DELETE /api/mgnt-sys-cse/events/:id

Supprime un événement.

**Response 200:**
```json
{
  "success": true,
  "message": "Événement supprimé avec succès"
}
```

### PATCH /api/mgnt-sys-cse/events/:id/cancel

Annule un événement (change status à "cancelled").

**Response 200:**
```json
{
  "success": true,
  "message": "Événement annulé avec succès",
  "data": { /* Event object avec status: "cancelled" */ }
}
```

### PATCH /api/mgnt-sys-cse/events/:id/publication

Change le statut de publication (non utilisé dans les événements actuels).

**Request:**
```json
{
  "publication_state": "online"  // ou "offline" ou "draft"
}
```

---

## 📋 Mapping des champs

### Back-office (camelCase) → API (snake_case)

Le back-office doit transformer les données avant envoi :

| Back-office (camelCase) | API (snake_case) |
|-------------------------|------------------|
| `categoryTag` | `category_tag` |
| `availabilityBadge` | `availability_badge` |
| `presenterName` | `presenter_name` |
| `organizerName` | `organizer_name` |
| `organizerUrl` | `organizer_url` |
| `startsAt` | `starts_at` |
| `endsAt` | `ends_at` |
| `rawDatetimeLabel` | `raw_datetime_label` |
| `venueName` | `venue_name` |
| `addressLine1` | `address_line1` |
| `postalCode` | `postal_code` |
| `fullAddress` | `full_address` |
| `minPriceCents` | `min_price_cents` |
| `ticketStatus` | `ticket_status` |
| `externalBookingUrl` | `external_booking_url` |
| `coverImageUrl` | `cover_image_url` |
| `galleryUrls` | `gallery_urls` |
| `descriptionHtml` | `description_html` |
| `infoPratiquesJson` | `info_pratiques_json` |
| `policyJson` | `policy_json` |

**Note**: Les réponses de l'API retournent en camelCase !

---

## 🎯 Champs à ajouter au formulaire back-office

Champs actuellement manquants dans `EventFormModal` :

### Organisateur
- `organizerUrl` - URL de l'organisateur

### Dates
- `timezone` - Fuseau horaire (default: "Europe/Paris")
- `rawDatetimeLabel` - Label texte libre pour affichage

### Adresse complète
- `addressLine1` - Ligne d'adresse
- `postalCode` - Code postal (actuellement présent mais pas mappé)
- `region` - Région
- `country` - Pays
- `fullAddress` - Adresse complète formatée
- `latitude` / `longitude` - Coordonnées GPS

### Tarification
- `minPriceCents` - Prix minimum en centimes
- `currency` - Code devise (default: "EUR")
- `ticketStatus` - Statut des billets ("available", "limited", "sold_out")
- `externalBookingUrl` - URL de réservation externe

### Médias
- `galleryUrls` - Array d'URLs pour galerie photos

### Contenu riche
- `descriptionHtml` - Description HTML (pas juste texte)
- `infoPratiquesJson` - Infos pratiques (JSON)
- `policyJson` - Politique/CGV (JSON)

### Métadonnées
- `source` - Source des données (optionnel)

---

## ⚡ Actions recommandées

1. **Mettre à jour `EventFormModal.tsx`** pour inclure tous les champs
2. **Mettre à jour `eventToApiFormat()`** dans `lib/api.ts` pour mapper tous les champs
3. **Ajouter validation** pour les champs requis (title, slug)
4. **Améliorer l'UX** :
   - Prévisualisation HTML pour descriptionHtml
   - Upload d'images pour galleryUrls
   - Sélecteur de timezone
   - Calculateur de prix (EUR → centimes)

---

## 📊 Statistiques actuelles

- **Utilisateurs** : 2 (1 admin, 1 user)
- **Événements** : 10 événements (tous type "afterworks" ou "masterclass")
- **Catégories utilisées** : afterworks, masterclass
- **Prix** : de 0€ à 25€
- **Localisations** : Principalement Paris et Île-de-France

---

## ✅ CORS

Tous les endpoints ont CORS activé avec support de la méthode OPTIONS.
