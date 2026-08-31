# ÉquiPension

Application React mobile de gestion de pension équine avec synchronisation Cloud Firestore.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Renseignez les variables Firebase dans `.env`. Dans Firebase, activez Firestore. Le document `pensions/haras-des-vallons` est créé automatiquement au premier lancement.

## Déploiement Vercel

Ajoutez les six variables `VITE_FIREBASE_*` dans les variables d'environnement du projet, puis utilisez `npm run build`. Le dossier de sortie est `dist`.

## Sécurité

Les règles Firestore sont sécurisées avec `request.auth != null`.
L'application ne crée pas de session anonyme. Une authentification Firebase explicite est requise pour accéder à Firestore avec ces règles.
Le flux de connexion intégré supporte Google Sign-In (popup) et email/mot de passe. Activez ces providers dans Firebase Console > Authentication > Sign-in method.
L'interface admin de liaison utilisateur/cavalier est limitée aux emails définis dans `VITE_ADMIN_EMAILS` (liste séparée par des virgules).
Sans liaison cavalier (`links` non vide), un utilisateur authentifié est bloqué et ne peut ni lire ni modifier les données.
