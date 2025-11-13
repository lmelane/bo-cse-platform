# 🎟️ Page Participants

La page Participants permet de visualiser et gérer tous les participants aux événements de la plateforme CSE.

## 📋 Fonctionnalités

### 🔍 Filtrage par événement
- **Sélecteur d'événement** : Dropdown permettant de choisir un événement spécifique
- Le premier événement est automatiquement sélectionné au chargement
- Affichage du titre et de la date de l'événement dans le sélecteur

### 📊 Statistiques en temps réel

La page affiche 4 cartes de statistiques :

1. **Réservations**
   - Nombre total de réservations
   - Nombre total de places réservées

2. **Revenu total**
   - Montant total en euros
   - Nombre de réservations payées

3. **Total invités**
   - Nombre total d'invités pour l'événement

4. **Statut des invités**
   - ✅ Invités validés
   - ⏱️ Invités en attente
   - ❌ Invités refusés

### 📝 Tableau détaillé des participants

Le tableau affiche pour chaque réservation :

| Colonne | Description |
|---------|-------------|
| **Titulaire** | Nom, prénom, email et association du titulaire de la réservation |
| **Places** | Nombre de places réservées |
| **Prix** | Prix total de la réservation en euros |
| **Paiement** | Statut du paiement (Payé / Non payé) |
| **Invités** | Liste des invités avec leur statut (validé/en attente/refusé) |
| **Date réservation** | Date et heure de la réservation |

### 🎨 États visuels

- **Loading** : Indicateur de chargement pendant la récupération des données
- **Empty State - Pas d'événements** : Message si aucun événement n'existe
- **Empty State - Pas de participants** : Message si l'événement n'a pas encore de participants
- **Erreur** : Affichage des messages d'erreur en cas de problème

### 🏷️ Badges de statut

Les statuts des invités sont identifiés par des badges colorés :
- 🟢 **Validé** : Badge vert pour les invités confirmés
- 🟡 **En attente** : Badge jaune pour les invités en attente de confirmation
- 🔴 **Refusé** : Badge rouge pour les invités ayant décliné l'invitation

## 🔗 API utilisée

La page utilise l'endpoint :
```
GET /api/mgnt-sys-cse/events/:id/participants
```

Qui retourne :
- Informations de l'événement
- Statistiques complètes
- Liste des participants avec titulaires et invités

## 🎯 Navigation

La page est accessible via :
- **Sidebar** : Menu "Participants" avec icône UserCheck
- **Dashboard** : Carte "Participants" cliquable

## 💡 Points techniques

- **React Hooks** : useState et useEffect pour la gestion du state
- **Date formatting** : Utilisation de date-fns avec locale française
- **Responsive** : Design adaptatif pour mobile et desktop
- **TypeScript** : Types complets pour toutes les données
- **Loading states** : Gestion fine des états de chargement

## 🚀 Améliorations futures possibles

- Export CSV des participants
- Filtres multiples (statut de paiement, statut des invités)
- Recherche par nom/email
- Pagination pour les événements avec beaucoup de participants
- Statistiques globales (tous événements confondus)
- Envoi d'emails aux participants
