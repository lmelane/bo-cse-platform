# Admin CSE - Back-office

Interface d'administration pour la plateforme d'événements CSE.

## 🚀 Stack Technique

- **Framework**: Next.js 15.5.4 avec App Router
- **Styling**: TailwindCSS 3.4
- **UI**: Lucide React pour les icônes
- **API Client**: Axios
- **Forms**: React Hook Form + Zod
- **Language**: TypeScript

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Créer le fichier .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local
```

## 🔧 Configuration

Le fichier `.env.local` doit contenir :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Authentification** : Le back-office utilise un système de login classique (email/password). Vous devez avoir un compte admin créé dans votre base de données.

## 🏃 Démarrage

```bash
# Lancer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:3002
```

**Important** : Assurez-vous que l'API principale (app-cse) tourne sur le port 3001 avant de démarrer le back-office.

## 📁 Structure du Projet

```
sys-mgnt-cse-admin/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── users/
│   │   └── page.tsx       # Gestion des utilisateurs
│   ├── events/
│   │   └── page.tsx       # Gestion des événements
│   ├── participants/
│   │   └── page.tsx       # Gestion des participants
│   └── layout.tsx
├── components/
│   ├── Sidebar.tsx        # Menu de navigation
│   └── AdminLayout.tsx    # Layout principal
├── lib/
│   ├── api.ts            # Client API
│   └── utils.ts          # Utilitaires
└── .env.local            # Variables d'environnement
```

## ✨ Fonctionnalités

### Gestion des Utilisateurs
- ✅ Lister tous les utilisateurs
- ✅ Voir les détails (email, nom, association, rôle)
- ✅ **Informations d'abonnement** (type, statut, dates, prix)
- ✅ **IDs Stripe** (customer et subscription)
- ✅ Promouvoir/Rétrograder les rôles (user ↔ admin)
- ✅ Voir le statut d'onboarding

### Gestion des Événements
- ✅ Lister tous les événements
- ✅ Créer/Modifier/Supprimer des événements
- ✅ Changer le statut de publication
- ✅ Annuler des événements
- ✅ **Voir les participants** (titulaires + invités)
- ✅ **Statistiques détaillées** (réservations, revenus, places)

### Gestion des Invités
- ✅ **Liste globale** de tous les invités
- ✅ **Filtres** par statut (pending/validated/refused)
- ✅ **Filtres** par événement
- ✅ **Pagination** (limit/offset)
- ✅ Voir la réservation et l'événement associés

## 🎨 Design System

Le back-office utilise le même design system que l'application principale CSE :
- **Couleur principale** : Brand (#A32144)
- **Typographie** : Poppins
- **Composants** : Design minimaliste et épuré

## 🔒 Sécurité

L'accès au back-office est protégé par :
- **Authentification JWT** : Login via email/password
- **Vérification du rôle** : Seuls les utilisateurs avec le rôle `admin` peuvent se connecter
- **Token JWT** : Automatiquement ajouté à toutes les requêtes API via l'intercepteur axios

## 📝 Scripts

```bash
npm run dev      # Démarrer en mode développement (port 3002)
npm run build    # Build de production
npm run start    # Démarrer en mode production
npm run lint     # Linter le code
```

## 🔗 API Endpoints Utilisés

### Utilisateurs
- `GET /api/mgnt-sys-cse/users` - Liste des utilisateurs (avec infos d'abonnement)
- `GET /api/mgnt-sys-cse/users/:id` - Détails d'un utilisateur
- `PATCH /api/mgnt-sys-cse/users/:id/role` - Changer le rôle

### Événements
- `GET /api/mgnt-sys-cse/events` - Liste des événements
- `POST /api/mgnt-sys-cse/events` - Créer un événement
- `PUT /api/mgnt-sys-cse/events/:id` - Modifier un événement
- `DELETE /api/mgnt-sys-cse/events/:id` - Supprimer un événement
- `GET /api/mgnt-sys-cse/events/:id/participants` - Participants d'un événement

### Invités
- `GET /api/mgnt-sys-cse/guests` - Liste globale des invités (avec filtres et pagination)

## 🛠️ Développement

L'application est configurée pour fonctionner avec Turbopack pour un développement ultra-rapide.

Pour contribuer :
1. Cloner le dépôt
2. Installer les dépendances
3. Configurer `.env.local`
4. Lancer `npm run dev`

## 📄 License

Private - Plateforme CSE
