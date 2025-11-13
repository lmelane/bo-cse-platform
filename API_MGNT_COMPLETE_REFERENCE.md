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

**Réponse :**
```json
{
  "success": true,
  "data": {
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
    "updatedAt": "2025-10-15T10:05:00.000Z",
    "passwordUpdatedAt": "2025-09-20T12:00:00.000Z"
  }
}
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
      
      // Titulaire
      "holder": {
        "userId": "user-uuid",
        "email": "jean.dupont@example.com",
        "firstName": "Jean",
        "lastName": "Dupont",
        "association": "Centraliens Paris"
      },
      
      // Événement
      "event": {
        "id": "event-uuid",
        "title": "Conférence Tech 2025",
        "startsAt": "2025-11-15T14:00:00.000Z",
        "city": "Paris",
        "venueName": "Station F"
      },
      
      // Invités
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

**Paramètres :**
- `id` (path) : UUID de l'événement

**Exemple :**
```http
GET /api/mgnt-sys-cse/events/66b1d7b7-f570-4cd7-a829-449600b6afbe/participants
```

**Réponse :**
```json
{
  "event": {
    "id": "66b1d7b7-f570-4cd7-a829-449600b6afbe",
    "title": "Conférence Tech 2025",
    "startsAt": "2025-11-15T14:00:00.000Z"
  },
  
  "stats": {
    "totalBookings": 45,
    "totalPlaces": 78,
    "totalRevenue": 337500,
    "paidBookings": 45,
    "unpaidBookings": 0,
    "totalGuests": 33,
    "guestsValidated": 28,
    "guestsPending": 4,
    "guestsRefused": 1
  },
  
  "participants": [
    {
      "bookingId": "abc123-def456",
      "createdAt": "2025-10-20T10:00:00.000Z",
      "isPaid": true,
      "totalPlaces": 2,
      "totalPriceCents": 3000,
      "status": "validated",
      
      // Titulaire de la réservation
      "holder": {
        "userId": "user-uuid",
        "email": "jean.dupont@example.com",
        "firstName": "Jean",
        "lastName": "Dupont",
        "association": "Centraliens Paris"
      },
      
      // Liste des invités
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
  ]
}
```

**Statistiques fournies :**

| Stat | Description |
|------|-------------|
| `totalBookings` | Nombre total de réservations |
| `totalPlaces` | Nombre total de places réservées |
| `totalRevenue` | Revenu total en centimes |
| `paidBookings` | Nombre de réservations payées |
| `unpaidBookings` | Nombre de réservations impayées |
| `totalGuests` | Nombre total d'invités |
| `guestsValidated` | Invités ayant confirmé leur présence |
| `guestsPending` | Invités en attente de confirmation |
| `guestsRefused` | Invités ayant refusé |

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

**Exemples :**

```http
# Tous les invités en attente
GET /api/mgnt-sys-cse/guests?status=pending

# Invités d'un événement spécifique
GET /api/mgnt-sys-cse/guests?eventId=66b1d7b7-f570-4cd7-a829-449600b6afbe

# Pagination (page 2, 50 par page)
GET /api/mgnt-sys-cse/guests?limit=50&offset=50

# Combinaison de filtres
GET /api/mgnt-sys-cse/guests?status=pending&eventId=xxx&limit=25
```

**Réponse :**
```json
{
  "stats": {
    "total": 245,
    "validated": 198,
    "pending": 42,
    "refused": 5
  },
  
  "guests": [
    {
      "id": "guest-uuid",
      "firstName": "Pierre",
      "lastName": "Durand",
      "email": "pierre.durand@example.com",
      "status": "pending",
      "createdAt": "2025-10-25T09:30:00.000Z",
      
      // Info sur la réservation
      "booking": {
        "id": "booking-uuid",
        "isPaid": true,
        "totalPriceCents": 1500,
        "holder": {
          "email": "sophie.martin@example.com",
          "firstName": "Sophie",
          "lastName": "Martin"
        }
      },
      
      // Info sur l'événement
      "event": {
        "id": "event-uuid",
        "title": "Workshop IA",
        "startsAt": "2025-11-20T10:00:00.000Z"
      }
    }
  ],
  
  "pagination": {
    "total": 245,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Statuts des invités :**

| Status | Description |
|--------|-------------|
| `pending` | En attente de confirmation (événements gratuits) |
| `validated` | Présence confirmée (payé ou confirmé) |
| `refused` | A refusé l'invitation |

---

## 📊 EXEMPLES D'UTILISATION

### Use Case 1 : Voir tous les utilisateurs avec abonnement actif

```bash
curl -X GET \
  'http://localhost:3001/api/mgnt-sys-cse/users' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  | jq '.data[] | select(.subscriptionStatus == "ACTIVE")'
```

### Use Case 2 : Compter les utilisateurs par type d'abonnement

```bash
curl -X GET \
  'http://localhost:3001/api/mgnt-sys-cse/users' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  | jq '[.data[].subscriptionType] | group_by(.) | map({type: .[0], count: length})'
```

### Use Case 3 : Liste des invités en attente pour un événement

```bash
curl -X GET \
  'http://localhost:3001/api/mgnt-sys-cse/guests?status=pending&eventId=66b1d7b7-f570-4cd7-a829-449600b6afbe' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Use Case 4 : Exporter les participants d'un événement en CSV

```bash
curl -X GET \
  'http://localhost:3001/api/mgnt-sys-cse/events/66b1d7b7-f570-4cd7-a829-449600b6afbe/participants' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  | jq -r '.participants[] | [.holder.email, .holder.firstName, .holder.lastName] | @csv'
```

---

## 🔒 CODES D'ERREUR

| Code | Message | Description |
|------|---------|-------------|
| 401 | Non authentifié | Token JWT manquant ou invalide |
| 403 | Accès refusé | L'utilisateur n'a pas le rôle admin |
| 404 | Non trouvé | Ressource demandée introuvable |
| 500 | Erreur serveur | Erreur interne du serveur |

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

---

## 🎯 RÉSUMÉ

| Route | Méthode | Description | Pagination |
|-------|---------|-------------|------------|
| `/api/mgnt-sys-cse/users` | GET | Liste tous les utilisateurs | Non |
| `/api/mgnt-sys-cse/users/:id` | GET | Détails d'un utilisateur | N/A |
| **`/api/mgnt-sys-cse/participants`** | **GET** | **Liste TOUS les participants (tous événements)** | **Oui** |
| `/api/mgnt-sys-cse/events/:id/participants` | GET | Participants d'un événement spécifique | Non |
| `/api/mgnt-sys-cse/guests` | GET | Liste globale des invités uniquement | Oui |

**Toutes les routes nécessitent** : JWT + Role admin ✅

---

## 📅 Events Management (Anciennes routes conservées)

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
