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
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_TOKEN=IVNsZsL3HuXGS+1XGS94SxW+cDjelE/VV3wFCSVW7XQ=' > .env.local
```

## 🔧 Configuration

Le fichier `.env.local` doit contenir :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_TOKEN=<votre-token-admin>
```

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
- ✅ Promouvoir/Rétrograder les rôles (user ↔ admin)
- ✅ Voir le statut d'onboarding

### Gestion des Événements (à venir)
- Lister tous les événements
- Créer/Modifier/Supprimer des événements
- Changer le statut de publication
- Annuler des événements

## 🎨 Design System

Le back-office utilise le même design system que l'application principale CSE :
- **Couleur principale** : Brand (#A32144)
- **Typographie** : Poppins
- **Composants** : Design minimaliste et épuré

## 🔒 Sécurité

Toutes les requêtes vers l'API sont authentifiées avec le token admin défini dans `.env.local`. Ce token doit correspondre à la variable `ADMIN_API_TOKEN` configurée dans l'API principale.

## 📝 Scripts

```bash
npm run dev      # Démarrer en mode développement (port 3002)
npm run build    # Build de production
npm run start    # Démarrer en mode production
npm run lint     # Linter le code
```

## 🔗 API Endpoints Utilisés

- `GET /api/mgnt-sys-cse/users` - Liste des utilisateurs
- `GET /api/mgnt-sys-cse/users/:id` - Détails d'un utilisateur
- `PATCH /api/mgnt-sys-cse/users/:id/role` - Changer le rôle
- `GET /api/mgnt-sys-cse/events` - Liste des événements
- `POST /api/mgnt-sys-cse/events` - Créer un événement
- `PUT /api/mgnt-sys-cse/events/:id` - Modifier un événement
- `DELETE /api/mgnt-sys-cse/events/:id` - Supprimer un événement

## 🛠️ Développement

L'application est configurée pour fonctionner avec Turbopack pour un développement ultra-rapide.

Pour contribuer :
1. Cloner le dépôt
2. Installer les dépendances
3. Configurer `.env.local`
4. Lancer `npm run dev`

## 📄 License

Private - Plateforme CSE
