# Documentation API client

## 1. Objectif

Cette API permet à un client tiers d’accéder en lecture aux données de concerts, salles et groupes, dans un cadre privé et sécurisé, en mode serveur à serveur.

Elle est conçue pour être simple à intégrer, avec des réponses JSON homogènes et des filtres de recherche utiles pour les cas d’usage métier.

## 2. Base URL

En environnement local :

```text
http://localhost:3000
```

En production :

```text
https://votre-domaine.com
```

## 3. Authentification

Toutes les routes sous `/api` nécessitent une clé API.

### Headers requis

```http
x-api-key: VOTRE_CLE_API
```

Alternative supportée :

```http
Authorization: ApiKey VOTRE_CLE_API
```

### Règles

- la clé est obligatoire pour toutes les routes protégées ;
- si elle est absente ou invalide, le serveur répond avec un statut `401` ;
- ne jamais exposer la clé côté navigateur ou dans du code public.

## 4. Vérification du service

### GET /health

Cette route permet de vérifier que l’API est disponible.

```bash
curl http://localhost:3000/health
```

Réponse :

```json
{
  "ok": true,
  "status": "healthy"
}
```

## 5. Format des réponses

### Réponse paginée

Les endpoints listant des concerts renvoient un format standard :

```json
{
  "data": [
    {
      "id": 42,
      "dateTime": "2026-10-10T20:00:00.000Z",
      "countryId": 1,
      "departmentCode": "75",
      "city": "Paris",
      "venueName": "Le Zenith",
      "venueAddress": "1 rue de la République",
      "venueId": 9,
      "groups": [
        {
          "id": 12,
          "name": "The Beatles",
          "positionOnPoster": 1,
          "musicalStyle": "Rock"
        }
      ]
    }
  ],
  "count_total": 128,
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

### Règle de pagination

- `count_total` : nombre total d’éléments correspondant au filtre
- `page` : page courante
- `limit` : nombre d’éléments par page

Pour savoir s’il existe une page supplémentaire :

```text
page * limit < count_total
```

Si c’est vrai, il faut charger la page suivante.

## 6. Liste des ressources

### 6.1 Concerts

#### GET /api/concerts

Retourne la liste des concerts avec filtres et pagination.

Paramètres disponibles :

- `groupId` : identifiant du groupe
- `department` : code du département
- `city` : ville du concert
- `from` : date de début (format `YYYY-MM-DD` ou ISO 8601)
- `to` : date de fin (format `YYYY-MM-DD` ou ISO 8601)
- `includePast` : `true` ou `false`
- `page` : numéro de page, par défaut `1`
- `limit` : taille de page, par défaut `20`, max `100`

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" \
  "http://localhost:3000/api/concerts?groupId=12&city=Paris&includePast=false&page=1&limit=20"
```

Réponse type :

```json
{
  "data": [
    {
      "id": 42,
      "dateTime": "2026-10-10T20:00:00.000Z",
      "countryId": 1,
      "departmentCode": "75",
      "city": "Paris",
      "venueName": "Le Zenith",
      "venueAddress": "1 rue de la République",
      "venueId": 9,
      "groups": [
        {
          "id": 12,
          "name": "The Beatles",
          "positionOnPoster": 1,
          "musicalStyle": "Rock"
        }
      ]
    }
  ],
  "count_total": 128,
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

#### GET /api/concerts/:id

Retourne un concert unique avec les groupes associés.

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" "http://localhost:3000/api/concerts/42"
```

Réponse type :

```json
{
  "data": {
    "id": 42,
    "dateTime": "2026-10-10T20:00:00.000Z",
    "countryId": 1,
    "departmentCode": "75",
    "city": "Paris",
    "venueName": "Le Zenith",
    "venueAddress": "1 rue de la République",
    "venueId": 9,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-02T00:00:00.000Z",
    "groups": [
      {
        "id": 12,
        "name": "The Beatles",
        "officialWebsite": "https://example.com",
        "style": "Rock",
        "twitter": "@beatles",
        "positionOnPoster": 1,
        "musicalStyle": "Rock"
      }
    ]
  }
}
```

### 6.2 Salles

#### GET /api/venues/:id

Retourne le détail d’une salle.

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" "http://localhost:3000/api/venues/9"
```

Réponse type :

```json
{
  "data": {
    "id": 9,
    "name": "Le Zenith",
    "department": "75",
    "city": "Paris",
    "address": "1 rue de la République",
    "postalCode": "75000",
    "latitude": 48.8,
    "longitude": 2.2,
    "country": "FR",
    "activity": "music"
  }
}
```

#### GET /api/venues/:id/concerts

Retourne les concerts d’une salle donnée.

Paramètres :

- `includePast` : `true` ou `false`
- `page` : numéro de page
- `limit` : taille de page

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" \
  "http://localhost:3000/api/venues/9/concerts?includePast=false&page=1&limit=10"
```

Réponse type :

```json
{
  "data": [
    {
      "id": 42,
      "dateTime": "2026-10-10T20:00:00.000Z",
      "countryId": 1,
      "departmentCode": "75",
      "city": "Paris",
      "venueName": "Le Zenith",
      "venueAddress": "1 rue de la République",
      "venueId": 9,
      "groups": [
        {
          "id": 12,
          "name": "The Beatles",
          "positionOnPoster": 1,
          "musicalStyle": "Rock"
        }
      ]
    }
  ],
  "count_total": 42,
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

### 6.3 Groupes

#### GET /api/groups/:id

Retourne le détail d’un groupe.

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" "http://localhost:3000/api/groups/12"
```

Réponse type :

```json
{
  "data": {
    "id": 12,
    "name": "The Beatles",
    "officialWebsite": "https://example.com",
    "style": "Rock",
    "twitter": "@beatles"
  }
}
```

#### GET /api/groups/:id/concerts

Retourne les concerts d’un groupe donné.

Paramètres :

- `includePast` : `true` ou `false`
- `page` : numéro de page
- `limit` : taille de page

Exemple :

```bash
curl -H "x-api-key: VOTRE_CLE_API" \
  "http://localhost:3000/api/groups/12/concerts?includePast=false&page=1&limit=10"
```

Réponse type :

```json
{
  "data": [
    {
      "id": 42,
      "dateTime": "2026-10-10T20:00:00.000Z",
      "countryId": 1,
      "departmentCode": "75",
      "city": "Paris",
      "venueName": "Le Zenith",
      "venueAddress": "1 rue de la République",
      "venueId": 9,
      "groups": [
        {
          "id": 12,
          "name": "The Beatles",
          "positionOnPoster": 1,
          "musicalStyle": "Rock"
        }
      ]
    }
  ],
  "count_total": 18,
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

## 7. Codes HTTP

- `200 OK` : requête réussie
- `401 Unauthorized` : clé API absente ou invalide
- `404 Not Found` : ressource introuvable
- `500 Internal Server Error` : erreur côté serveur ou base de données

## 8. Exemple d’intégration côté client

### JavaScript / Fetch

```javascript
const apiKey = 'VOTRE_CLE_API';
const baseUrl = 'http://localhost:3000';

async function fetchConcerts(page = 1, limit = 20) {
  const response = await fetch(`${baseUrl}/api/concerts?page=${page}&limit=${limit}&includePast=false`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erreur API');
  }

  const payload = await response.json();
  return payload;
}

const result = await fetchConcerts(1, 20);
console.log(result.count_total);
console.log(result.data.length);
```

### Règle de chargement de page suivante

```javascript
const page = 1;
const limit = 20;
const result = await fetchConcerts(page, limit);

if (page * limit < result.count_total) {
  console.log('Une page supplémentaire est disponible');
}
```

## 9. Bonnes pratiques client

- toujours inclure la clé API dans les requêtes protégées ;
- utiliser les filtres `groupId`, `department`, `city`, `from`, `to` pour réduire le volume de données ;
- gérer la pagination avec `count_total` ;
- ne pas dépendre du format interne de la base de données ;
- traiter les dates comme des ISO 8601, en UTC ou locale selon votre besoin.

## 10. Notes importantes

- L’API est orientée lecture seule.
- Les champs exposés sont normalisés et ne reflètent pas toujours le nom exact des colonnes SQL.
- Les concerts incluent les groupes associés dans le tableau `groups`.
- Les détails de salle et de groupe ne contiennent pas de liste de concerts, afin de garder une réponse plus prévisible.
