# FOTOL JAY Backend

Backend API pour l'application FOTOL JAY - Plateforme de vente de produits d'occasion avec authentification photo obligatoire.

## 🚀 Fonctionnalités

- **Authentification JWT** avec rôles (Utilisateur, VIP, Pro, Modérateur, Admin)
- **Gestion des produits** avec upload d'images obligatoire et compression
- **Modération** des annonces par les administrateurs
- **Messagerie temps réel** via Socket.io
- **Système VIP** avec priorité d'affichage
- **Gestion des crédits** pour boosts et options
- **Notifications push** via Firebase
- **API REST** documentée avec Swagger
- **Cache Redis** pour les performances
- **Logs** avec Winston
- **Sécurité** renforcée (Helmet, CORS, Rate Limiting)

## 🛠️ Stack Technique

- **Node.js** v18+
- **TypeScript**
- **Express.js**
- **Prisma ORM** (MySQL)
- **Zod** (Validation)
- **JWT** (Authentification)
- **Socket.io** (Temps réel)
- **Multer + Sharp** (Upload images)
- **Redis** (Cache)
- **Firebase Admin** (Notifications push)

## 📋 Prérequis

- Node.js v18+
- MySQL 8.0+
- Redis (optionnel pour le cache)
- Firebase project (pour les notifications)

## 🔧 Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd fotol-jay-backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   - Copier `.env.example` vers `.env`
   - Configurer les variables d'environnement :
     ```env
     DATABASE_URL="mysql://username:password@localhost:3306/fotoljay_db"
     JWT_SECRET="your-super-secret-jwt-key"
     REFRESH_TOKEN_SECRET="your-refresh-token-secret"
     REDIS_URL="redis://localhost:6379"
     FIREBASE_PROJECT_ID="your-firebase-project-id"
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
     UPLOAD_PATH="./uploads"
     NODE_ENV="development"
     ```

4. **Configuration de la base de données**
   ```bash
   # Générer le client Prisma
   npm run prisma:generate

   # Appliquer les migrations
   npm run prisma:migrate

   # (Optionnel) Ouvrir Prisma Studio
   npm run prisma:studio
   ```

5. **Démarrer le serveur**
   ```bash
   # Mode développement
   npm run dev

   # Mode production
   npm run build
   npm start
   ```

## 📚 API Documentation

Une fois le serveur démarré, la documentation Swagger est disponible sur :
```
http://localhost:5000/api-docs
```

## 🏗️ Structure du Projet

```
src/
├── modules/
│   ├── auth/          # Authentification et autorisation
│   ├── users/         # Gestion des utilisateurs
│   ├── products/      # CRUD des produits
│   ├── notifications/ # Notifications push et internes
│   ├── admin/         # Tableau de bord admin
│   ├── chat/          # Messagerie temps réel
│   ├── vip/           # Système VIP
│   └── credits/       # Gestion des crédits
├── middlewares/       # Middlewares personnalisés
├── services/          # Services métier
├── utils/             # Utilitaires
├── jobs/              # Tâches planifiées
├── prisma/            # Client Prisma
├── app.ts             # Configuration Express
└── server.ts          # Point d'entrée serveur
```

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Les tokens sont requis pour la plupart des endpoints.

### Rôles utilisateur :
- **USER** : Utilisateur standard
- **VIP** : Utilisateur premium
- **PRO** : Vendeur professionnel
- **MODERATOR** : Modérateur
- **ADMIN** : Administrateur

## 📡 Endpoints Principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir token

### Produits
- `GET /api/products` - Lister les produits
- `POST /api/products` - Créer un produit (avec images)
- `GET /api/products/:id` - Détails d'un produit
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### Messagerie
- WebSocket sur `/socket.io`
- Événements : `sendMessage`, `newMessage`, `typing`

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 🚀 Déploiement

### Variables d'environnement production
Assurez-vous de configurer correctement les variables d'environnement pour la production.

### Build
```bash
npm run build
```

### Démarrage en production
```bash
npm start
```

## 📝 Scripts Disponibles

- `npm run dev` - Démarrage en développement (avec ts-node)
- `npm run build` - Compilation TypeScript
- `npm start` - Démarrage en production
- `npm test` - Exécution des tests
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Appliquer les migrations
- `npm run prisma:studio` - Ouvrir Prisma Studio

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.