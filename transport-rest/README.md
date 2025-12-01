# 🚍 Service REST - Mobilité Intelligente

Service REST pour la gestion des transports publics dans une ville intelligente.

## 📋 Fonctionnalités

- ✅ Consultation des horaires de transport
- ✅ Suivi de l'état du trafic en temps réel
- ✅ Gestion des incidents et perturbations
- ✅ Correspondances entre différentes lignes
- ✅ Disponibilité des transports
- ✅ Signalement de problèmes par les citoyens

## 🛠️ Technologies

- **Node.js** v18+
- **Express.js** pour le serveur REST
- **Docker** pour la conteneurisation

## 📦 Installation

### Installation locale

```bash

npm install


npm start

npm run dev
```

### Avec Docker

```bash

docker build -t transport-rest-service .

docker run -p 3001:3001 transport-rest-service
```

## 🚀 Démarrage rapide

Le service démarre sur le port **3001** par défaut.

```bash

curl http://localhost:3001/api/health
```

## 📍 Endpoints disponibles

### Lines (Lignes de transport)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/lines` | Liste toutes les lignes |
| GET | `/api/lines/:id` | Détails d'une ligne |
| GET | `/api/lines/:id/timetable` | Horaires d'une ligne |
| GET | `/api/lines/:id/next-departure` | Prochain départ |
| PUT | `/api/lines/:id` | Mettre à jour le statut |
| POST | `/api/lines/:id/report` | Signaler un problème |

### Traffic (Trafic)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/traffic/status` | État général du trafic |
| GET | `/api/traffic/line/:id` | Trafic sur une ligne |
| DELETE | `/api/traffic/incidents/:id` | Résoudre un incident |

### Connections (Correspondances)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/connections` | Toutes les correspondances |
| GET | `/api/connections/:stop` | Correspondances à un arrêt |

### Availability (Disponibilité)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/transport/availability` | Disponibilité des transports |

## 💡 Exemples d'utilisation

### Récupérer toutes les lignes

```bash
curl http://localhost:3001/api/lines
```

### Filtrer les lignes par type

```bash
curl http://localhost:3001/api/lines?type=bus
```

### Obtenir les horaires d'une ligne

```bash
curl http://localhost:3001/api/lines/1/timetable
```

### Vérifier l'état du trafic

```bash
curl http://localhost:3001/api/traffic/status
```

### Signaler un problème

```bash
curl -X POST http://localhost:3001/api/lines/1/report \
  -H "Content-Type: application/json" \
  -d '{
    "issue_type": "delay",
    "description": "Bus en retard de 15 minutes",
    "reporter": "user123"
  }'
```

### Mettre à jour le statut d'une ligne

```bash
curl -X PUT http://localhost:3001/api/lines/2 \
  -H "Content-Type: application/json" \
  -d '{"status": "on_time"}'
```

## 📚 Documentation API

La documentation complète OpenAPI/Swagger est disponible dans le fichier `openapi.yaml`.

Vous pouvez l'importer dans [Swagger Editor](https://editor.swagger.io/) pour une visualisation interactive.

## 🐳 Docker Compose (optionnel)

```yaml
version: '3.8'
services:
  transport-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
    restart: unless-stopped
```

## 🔧 Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| PORT | 3001 | Port du service |
| NODE_ENV | production | Environnement |

## 📊 Structure du projet

```
transport-rest-service/
├── server.js           # Code principal du service
├── package.json        # Dépendances npm
├── Dockerfile          # Configuration Docker
├── .dockerignore       # Fichiers exclus de Docker
├── openapi.yaml        # Documentation API
└── README.md          # Ce fichier
```

## 🧪 Tests

```bash
# Tester le health check
curl http://localhost:3001/api/health

# Tester toutes les routes
npm test
```

## 📝 Notes

- Les données sont actuellement mockées en mémoire
- Pour un environnement de production, connectez à une vraie base de données
- Ajoutez l'authentification pour les endpoints de modification (PUT, POST, DELETE)

## 🔜 Prochaines étapes

1. Intégrer avec les autres services (SOAP, GraphQL, gRPC)
2. Ajouter l'API Gateway
3. Implémenter le client web
4. Mettre en place l'orchestration des services

## 👥 Auteur

Projet Smart City - Service de Mobilité Intelligente