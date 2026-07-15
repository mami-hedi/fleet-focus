# FleetOps API — Backend (fleet-focus)

Backend Node.js / Express / MySQL pour le projet frontend **fleet-focus**
(github.com/mami-hedi/fleet-focus). Fournit une API REST complète et un
schéma de base de données couvrant tous les modules de l'app : véhicules,
chauffeurs, réservations, carburant, incidents, états des lieux,
maintenances, documents, alertes, journal d'activité et paramètres.

## Stack

- Node.js + Express 4
- MySQL + Sequelize (ORM)
- JWT (auth) + bcryptjs (hash mots de passe)
- express-validator (validation), helmet, cors, express-rate-limit
- morgan (logs), compression

## Démarrage rapide

```bash
cd backend
npm install
cp .env.example .env      # puis renseigner DB_USER / DB_PASSWORD / JWT_SECRET
```

Créer la base MySQL (vide, le schéma est généré par Sequelize) :

```sql
CREATE DATABASE fleetops CHARACTER SET utf8mb4;
```

Peupler la base avec les mêmes données de démo que le frontend
(véhicules, chauffeurs, réservations, etc.) + un compte admin :

```bash
npm run seed
```

Cela affiche les identifiants de connexion (par défaut
`admin@mhdigital.tn` / `Admin123!`, modifiables via `.env`).

Démarrer le serveur :

```bash
npm run dev      # avec nodemon
# ou
npm start
```

L'API est disponible sur `http://localhost:4000/api`, healthcheck sur
`http://localhost:4000/health`.

> Alternative : `database/schema.sql` contient le même schéma en SQL brut,
> utile pour des migrations manuelles en production plutôt que
> `sequelize.sync()`.

## Structure

```
backend/
├── database/
│   └── schema.sql            # schéma SQL de référence
├── src/
│   ├── config/database.js    # connexion Sequelize
│   ├── models/                # 1 fichier par table + associations (index.js)
│   ├── controllers/           # logique métier par ressource
│   ├── routes/                # routes Express par ressource
│   ├── middlewares/           # auth (JWT), validation, gestion d'erreurs
│   ├── utils/                 # ApiError, ApiResponse, pagination, crudFactory,
│   │                          # activityLogger, alertService
│   ├── seed/                  # données de démo + script de seed
│   ├── app.js                 # config Express (middlewares globaux, routes)
│   └── server.js              # point d'entrée (connexion DB + listen)
└── package.json
```

## Authentification

JWT porté dans l'en-tête `Authorization: Bearer <token>`. Toutes les routes
`/api/*` (hors `/api/auth/login`) exigent d'être authentifié. Trois rôles :
`admin`, `manager`, `staff`. La création de nouveaux comptes
(`POST /api/auth/register`) est réservée aux admins.

```
POST /api/auth/login        { email, password } -> { user, token }
GET  /api/auth/me           (Bearer token)
POST /api/auth/register     (admin uniquement)
```

## Endpoints principaux

Toutes les ressources suivent le même schéma REST
(`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`) avec
pagination (`?page=&limit=`), recherche (`?search=`) et filtres par champ
(ex: `?status=`, `?vehicleId=`) :

| Ressource      | Base URL                 | Spécificités |
|----------------|---------------------------|--------------|
| Véhicules      | `/api/vehicles`            | `GET /:id/full` (fiche complète), `GET /:id/history` |
| Chauffeurs     | `/api/drivers`             | filtre `assignedVehicleId` |
| Réservations   | `/api/reservations`        | `GET /check-availability` (chevauchement de dates) |
| Carburant      | `/api/fuel-entries`        | `totalCost` recalculé automatiquement |
| Incidents      | `/api/incidents`           | filtres `severity`, `status` |
| États des lieux| `/api/inspections`         | checklist stockée en JSON |
| Maintenances   | `/api/maintenances`        | génère automatiquement les occurrences si `recurrence` ≠ `none` |
| Documents      | `/api/documents`           | filtre `type` |
| Alertes        | `/api/alerts`               | calculées à la volée (docs qui expirent + maintenances imminentes), `POST /:alertKey/dismiss` |
| Activité       | `/api/activity`            | journal auto-alimenté par toutes les actions ci-dessus |
| Paramètres     | `/api/settings`             | singleton (infos société, thème, langue) |
| Statistiques   | `/api/stats/dashboard`, `/api/stats/utilization` | agrégats pour le dashboard |

## Notes d'implémentation

- **Journal d'activité** : chaque création/modification importante
  (véhicule, chauffeur, réservation, maintenance, etc.) écrit une entrée
  dans `history_entries`, consommée par la page *Activité* du frontend.
- **Alertes** : pas de table dédiée — calculées dynamiquement à partir des
  documents proches de l'expiration et des maintenances à venir (même
  logique que `daysUntil()` côté frontend). `dismissed_alerts` permet de
  masquer une alerte sans supprimer la donnée sous-jacente.
- **Maintenances récurrentes** : reproduit la logique du store Zustand du
  frontend (`recurrenceMonths`) — 4 occurrences générées et reliées par un
  `seriesId` commun.
- **Sécurité** : mots de passe hashés (bcrypt, 10 rounds), helmet, rate
  limiting global (200 req / 15 min / IP), validation des payloads via
  express-validator sur toutes les routes de création.

## Variables d'environnement (`.env`)

Voir `.env.example` — `PORT`, `CLIENT_URL` (CORS), `DB_HOST/PORT/NAME/USER/PASSWORD`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

## Prochaines étapes suggérées

- Brancher le frontend (`src/lib/store.ts`) sur ces endpoints via un client
  HTTP (axios/fetch) + React Query, en remplaçant le store Zustand
  in-memory par des appels API.
- Ajouter l'upload de fichiers (photos véhicules/incidents, documents) —
  ex. stockage S3-compatible ou disque local + champ URL.
- Déployer sur Render (API) + PlanetScale/Railway (MySQL), cohérent avec
  la stack Vercel/Render déjà utilisée sur vos autres projets.
