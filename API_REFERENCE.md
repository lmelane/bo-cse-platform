# 🔧 RÉFÉRENCE API ADMIN - CSE Platform

Documentation complète des routes d'administration.

---

## 🔐 AUTHENTIFICATION

**Toutes les routes admin nécessitent :**
- ✅ Token JWT valide dans le header `Authorization: Bearer <token>` 
- ✅ Rôle `admin` dans la base de données

**Exemple de header :**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 GESTION DES UTILISATEURS

### 📋 Liste de tous les utilisateurs

**`GET /api/mgnt-sys-cse/users`**

**Description :** Récupère la liste complète de tous les utilisateurs avec leurs informations d'abonnement.

**Réponse :**
```json
{
  "success": true,
  "count": 142,
  "data": [
    {
      "id": "f0952d96-6f48-4922-85b8-3577178b530e",
      "email": "jean.dupont@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "association": "Centraliens Paris",
      "role": "user",
      "onboardingCompleted": true,
      
      // 💳 Informations d'abonnement
      "subscriptionType": "event_based",
      "subscriptionStatus": "ACTIVE",
      "subscriptionStartDate": "2025-10-15T10:00:00.000Z",
      "subscriptionEndDate": "2026-10-15T10:00:00.000Z",
      "subscriptionPriceCents": 3500,
      "stripeCustomerId": "cus_ABC123",
      "stripeSubscriptionId": "sub_XYZ789",
      
      // 📅 Dates
      "createdAt": "2025-09-20T12:00:00.000Z",
      "updatedAt": "2025-10-15T10:05:00.000Z"
    }
  ]
}
```

**Champs retournés :**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | ID unique de l'utilisateur |
| `email` | string | Email de connexion |
| `firstName` | string | Prénom |
| `lastName` | string | Nom |
| `association` | string \| null | Association (ex: "Centraliens Paris") |
| `role` | enum | Rôle : `"user"` ou `"admin"` |
| `onboardingCompleted` | boolean | ✅ Si l'onboarding est terminé |
| **`subscriptionType`** | enum \| null | Type : `"event_based"` ou `"unlimited"` |
| **`subscriptionStatus`** | enum \| null | Statut : `"ACTIVE"`, `"INACTIVE"`, `"EXPIRED"` |
| **`subscriptionStartDate`** | Date \| null | Date de début de l'abonnement |
| **`subscriptionEndDate`** | Date \| null | Date de fin de l'abonnement |
| **`subscriptionPriceCents`** | number \| null | Prix payé en centimes (3500 = 35€) |
| `stripeCustomerId` | string \| null | ID du customer Stripe |
| `stripeSubscriptionId` | string \| null | ID de la subscription Stripe |
| `createdAt` | Date | Date de création du compte |
| `updatedAt` | Date | Dernière mise à jour |

---

### 👤 Détails d'un utilisateur

**`GET /api/mgnt-sys-cse/users/:id`**

**Description :** Récupère les détails complets d'un utilisateur spécifique.

**Paramètres :**
- `id` (path) : UUID de l'utilisateur

**Exemple :**
```http
GET /api/mgnt-sys-cse/users/f0952d96-6f48-4922-85b8-3577178b530e
```

---

## 🎟️ GESTION DES PARTICIPANTS

### 🌍 Liste globale de TOUS les participants

**`GET /api/mgnt-sys-cse/participants`**

**Description :** Récupère la liste complète de TOUS les participants (titulaires + invités) de TOUS les événements, avec filtres et pagination.

**Query Paramètres :**

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `eventId` | UUID | Filtrer par événement spécifique | - |
| `status` | enum | Filtrer par statut : `validated`, `pending`, `cancelled` | - |
| `isPaid` | boolean | Filtrer par paiement : `true` ou `false` | - |
| `limit` | number | Nombre de résultats par page | 100 |
| `offset` | number | Offset pour la pagination | 0 |

**Exemples :**

```http
# Tous les participants (tous événements)
GET /api/mgnt-sys-cse/participants

# Participants d'un événement spécifique
GET /api/mgnt-sys-cse/participants?eventId=66b1d7b7-f570-4cd7-a829-449600b6afbe

# Réservations non payées
GET /api/mgnt-sys-cse/participants?isPaid=false

# Réservations validées et payées (pagination)
GET /api/mgnt-sys-cse/participants?status=validated&isPaid=true&limit=50&offset=0
```

**Réponse :**
```json
{
  "stats": {
    "totalBookings": 245,
    "totalPlaces": 412,
    "totalRevenue": 1856250,
    "paidBookings": 240,
    "unpaidBookings": 5,
    "totalGuests": 167,
    "guestsValidated": 142,
    "guestsPending": 22,
    "guestsRefused": 3
  },
  
  "participants": [
    {
      "bookingId": "abc123-def456",
      "createdAt": "2025-10-20T10:00:00.000Z",
      "isPaid": true,
      "totalPlaces": 2,
      "totalPriceCents": 3000,
      "status": "validated",
      
      "holder": {
        "userId": "user-uuid",
        "email": "jean.dupont@example.com",
        "firstName": "Jean",
        "lastName": "Dupont",
        "association": "Centraliens Paris"
      },
      
      "event": {
        "id": "event-uuid",
        "title": "Conférence Tech 2025",
        "startsAt": "2025-11-15T14:00:00.000Z",
        "city": "Paris",
        "venueName": "Station F"
      },
      
      "guests": [
        {
          "id": "guest-uuid",
          "firstName": "Marie",
          "lastName": "Martin",
          "email": "marie.martin@example.com",
          "status": "validated",
          "createdAt": "2025-10-20T10:05:00.000Z"
        }
      ]
    }
  ],
  
  "pagination": {
    "total": 245,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 📊 Participants par événement (legacy)

**`GET /api/mgnt-sys-cse/events/:id/participants`**

**Description :** Récupère la liste complète des participants (titulaires + invités) pour un événement donné, avec statistiques.

---

### 👥 Liste globale des invités

**`GET /api/mgnt-sys-cse/guests`**

**Description :** Récupère la liste de TOUS les invités (tous événements confondus) avec filtres et pagination.

**Query Paramètres :**

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `status` | enum | Filtrer par statut : `pending`, `validated`, `refused` | - |
| `eventId` | UUID | Filtrer par événement spécifique | - |
| `limit` | number | Nombre de résultats par page | 100 |
| `offset` | number | Offset pour la pagination | 0 |

---

## 📅 GESTION DES ÉVÉNEMENTS

### Structure complète d'un Event

```typescript
interface Event {
  // Identifiants
  id: string;
  slug: string;
  
  // Informations principales
  title: string;
  subtitle: string | null;
  categoryTag: string | null;
  
  // 🆕 Type d'événement
  eventType: "PHYSICAL" | "WEBINAR";
  webinarUrl: string | null;
  
  // Intervenants
  presenterName: string | null;
  organizerName: string | null;
  organizerUrl: string | null;
  
  // Dates et horaires
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  
  // Localisation
  venueName: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Tarification
  minPriceCents: number | null;
  currency: string | null;
  ticketStatus: string | null;
  externalBookingUrl: string | null;
  
  // Médias
  coverImageUrl: string | null;
  
  // Contenu
  descriptionHtml: string | null;
  infoPratiquesJson: object | null;
  policyJson: object | null;
  
  // Capacité & Quotas
  maxParticipants: number | null;
  limitedThreshold: number | null;
  
  // Statut
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  publicationStatus: "draft" | "online" | "offline";
  source: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
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

### GET /api/mgnt-sys-cse/events/:id

Récupère un événement par ID.

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

**Request (complet - événement PHYSICAL):**
```json
{
  "title": "Afterwork Innovation",
  "subtitle": "Networking et échanges",
  "slug": "afterwork-innovation-dec-2025",
  
  "event_type": "PHYSICAL",
  "webinar_url": null,
  
  "category_tag": "afterworks",
  "presenter_name": "Jean Dupont",
  "organizer_name": "CSE CentraleSupélec",
  "organizer_url": "https://example.com",
  "starts_at": "2025-12-15T18:00:00.000Z",
  "ends_at": "2025-12-15T21:00:00.000Z",
  "timezone": "Europe/Paris",
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
  "cover_image_url": "https://images.unsplash.com/photo.jpg",
  "description_html": "<p>Rejoignez-nous !</p>",
  "info_pratiques_json": null,
  "policy_json": null,
  "status": "scheduled",
  "publication_status": "online",
  "source": null,
  "max_participants": 100,
  "limited_threshold": 10
}
```

**Request (complet - événement WEBINAR):**
```json
{
  "title": "Webinar : Introduction à Next.js 15",
  "subtitle": "Découvrez les nouveautés en direct",
  "slug": "webinar-nextjs-15",
  
  "event_type": "WEBINAR",
  "webinar_url": "https://zoom.us/j/123456789",
  
  "category_tag": "tech",
  "presenter_name": "Sophie Martin",
  "organizer_name": "CSE Tech",
  "starts_at": "2024-12-10T14:00:00.000Z",
  "ends_at": "2024-12-10T16:00:00.000Z",
  "timezone": "Europe/Paris",
  "venue_name": null,
  "city": null,
  "min_price_cents": 0,
  "currency": "EUR",
  "ticket_status": "available",
  "cover_image_url": "https://images.unsplash.com/photo-xyz",
  "description_html": "<p>Rejoignez-nous...</p>",
  "status": "scheduled",
  "publication_status": "online",
  "max_participants": 100,
  "limited_threshold": 10
}
```

**⚠️ Règles de validation pour `event_type` :**

| Type | `webinar_url` | `venue_name` | Validation |
|------|---------------|--------------|------------|
| `WEBINAR` | ✅ **OBLIGATOIRE** | ❌ Optionnel | Erreur 400 si `webinar_url` manquant |
| `PHYSICAL` | ❌ Optionnel | ⚠️ Recommandé | Warning si `venue_name` manquant |

**⚠️ Logique hybride pour `ticket_status` :**

| Contexte | Comportement | Valeur par défaut |
|----------|--------------|-------------------|
| **Création** | Optionnel - Si non fourni, utilise `"available"` | `"available"` |
| **Modification** | Optionnel - Si non fourni, garde la valeur existante | (inchangé) |
| **Système** | Recalcule automatiquement selon les places disponibles | Auto |
| **Force manuelle** | Admin peut forcer `"closed"` pour bloquer les réservations | Manuel |

**Valeurs possibles :**
- `"available"` - Places disponibles
- `"limited"` - Dernières places (calculé auto)
- `"sold_out"` - Complet (calculé auto)
- `"closed"` - Fermé manuellement
- `"coming_soon"` - Bientôt disponible

### PUT /api/mgnt-sys-cse/events/:id

Met à jour un événement existant.

### DELETE /api/mgnt-sys-cse/events/:id

Supprime un événement.

### PATCH /api/mgnt-sys-cse/events/:id/cancel

Annule un événement (change status à "cancelled").

### PATCH /api/mgnt-sys-cse/events/:id/publication

Change le statut de publication.

---

## 📋 MAPPING DES CHAMPS

### Back-office (camelCase) → API (snake_case)

| Back-office (camelCase) | API (snake_case) |
|-------------------------|------------------|
| `categoryTag` | `category_tag` |
| **`eventType`** 🆕 | **`event_type`** |
| **`webinarUrl`** 🆕 | **`webinar_url`** |
| `presenterName` | `presenter_name` |
| `organizerName` | `organizer_name` |
| **`organizerUrl`** 🆕 | **`organizer_url`** |
| `startsAt` | `starts_at` |
| `endsAt` | `ends_at` |
| `venueName` | `venue_name` |
| `addressLine1` | `address_line1` |
| `postalCode` | `postal_code` |
| `fullAddress` | `full_address` |
| `minPriceCents` | `min_price_cents` |
| `ticketStatus` | `ticket_status` |
| `externalBookingUrl` | `external_booking_url` |
| `coverImageUrl` | `cover_image_url` |
| `descriptionHtml` | `description_html` |
| `infoPratiquesJson` | `info_pratiques_json` |
| `policyJson` | `policy_json` |
| `publicationStatus` | `publication_status` |
| `maxParticipants` | `max_participants` |
| `limitedThreshold` | `limited_threshold` |

**Note**: Les réponses de l'API retournent en camelCase !

---

## ✅ NOUVEAUX CHAMPS AJOUTÉS

### Dans le formulaire EventFormModal.tsx

1. **`eventType`** - Sélecteur PHYSICAL/WEBINAR avec logique conditionnelle
2. **`webinarUrl`** - URL du webinar (obligatoire si type = WEBINAR)
3. **`organizerUrl`** - Site web de l'organisateur

**Note:** `availabilityBadge` est calculé automatiquement côté backend et n'est pas modifiable

### Dans lib/api.ts

- Interface `Event` mise à jour avec tous les nouveaux champs
- Fonction `eventToApiFormat()` mise à jour pour mapper camelCase → snake_case

---

## 🔒 CODES D'ERREUR

| Code | Message | Description |
|------|---------|-------------|
| 401 | Non authentifié | Token JWT manquant ou invalide |
| 403 | Accès refusé | L'utilisateur n'a pas le rôle admin |
| 404 | Non trouvé | Ressource demandée introuvable |
| 500 | Erreur serveur | Erreur interne du serveur |

---

## 🎯 RÉSUMÉ

| Route | Méthode | Description | Pagination |
|-------|---------|-------------|------------|
| `/api/mgnt-sys-cse/users` | GET | Liste tous les utilisateurs | Non |
| `/api/mgnt-sys-cse/users/:id` | GET | Détails d'un utilisateur | N/A |
| **`/api/mgnt-sys-cse/participants`** | **GET** | **Liste TOUS les participants (tous événements)** | **Oui** |
| `/api/mgnt-sys-cse/events/:id/participants` | GET | Participants d'un événement spécifique | Non |
| `/api/mgnt-sys-cse/guests` | GET | Liste globale des invités uniquement | Oui |
| `/api/mgnt-sys-cse/events` | GET | Liste tous les événements | Non |
| `/api/mgnt-sys-cse/events` | POST | Crée un événement | N/A |
| `/api/mgnt-sys-cse/events/:id` | PUT | Met à jour un événement | N/A |
| `/api/mgnt-sys-cse/events/:id` | DELETE | Supprime un événement | N/A |

**Toutes les routes nécessitent** : JWT + Role admin ✅

---

## 📝 NOTES

### Données sensibles
- ✅ Les mots de passe ne sont **JAMAIS** retournés
- ✅ Seuls les admins peuvent accéder à ces routes
- ✅ Les IDs Stripe sont fournis pour faciliter le support

### Performance
- ✅ Pagination recommandée pour la liste des invités
- ✅ Les statistiques sont calculées en temps réel
- ✅ Toutes les requêtes sont optimisées (includes ciblés)

### Dates
- ✅ Toutes les dates sont au format ISO 8601 (UTC)
- ✅ Format : `2025-10-15T10:00:00.000Z` 
- ✅ Utilisez `new Date(dateString)` pour parser
