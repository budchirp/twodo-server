# Twodo Nest Backend

Fresh NestJS implementation of the backend using TypeORM and SQLite. The old Go `todo` domain was intentionally renamed to `note` and old routes are not kept.

## Migration Guide

This backend is a clean NestJS replacement for the original Go backend. It is not a one-to-one port. The database is fresh, the routes are redesigned, and `todo` has been removed as a product concept in favor of `note`.

### Migration Scope

Use this backend as a new service implementation:

```bash
npm install
cp .env.example .env
npm run start:dev
```

Do not point this app at the old Go `db.sqlite`. There is no old-data migration path. Start with a fresh SQLite database and let TypeORM create the schema.

### Route Changes

| Go route | Nest route | Notes |
| --- | --- | --- |
| `GET /server/version` | `GET /server/version` | Preserved. |
| none | `GET /server/health` | Added status endpoint. |
| `GET /user/` | `GET /users/me` | Renamed to plural resource style. |
| `POST /user/initialize` | `POST /users/initialize` | Same purpose. |
| `POST /user/invite` | `POST /invites` | Invite is now its own resource. |
| `GET /user/invite/all` | `GET /invites` | Removed `/all` suffix. |
| `PATCH /user/invite/:id` | `PATCH /invites/:id` | Same accept/reject behavior, stricter validation. |
| `POST /couple/leave` | `POST /couples/leave` | Renamed to plural resource style. |
| none | `GET /couples/me` | Added explicit current couple endpoint. |
| `GET /todo/all` | `GET /notes` | `todo` renamed to `note`; removed `/all`. |
| `POST /todo` | `POST /notes` | `todo` renamed to `note`. |
| `GET /todo/:id` | `GET /notes/:id` | `todo` renamed to `note`. |
| `PATCH /todo/:id` | `PATCH /notes/:id` | `todo` renamed to `note`. |
| `DELETE /todo/:id` | `DELETE /notes/:id` | `todo` renamed to `note`. |

### Database Changes

The old GORM schema is replaced by a fresh TypeORM schema:

| Old table/field | New table/field | Notes |
| --- | --- | --- |
| `users.couple_id` | `couple_members` | Couple membership is now explicit. |
| `todos` | `notes` | Todo no longer exists. |
| `todos.completed` | removed | Notes are not completable todos. |
| GORM auto-migrate | TypeORM `synchronize: true` | Fresh database only. |

Core tables:

```text
users
couples
couple_members
invites
notes
```

### Auth Migration

Authenticated routes still require:

```text
Authorization: Bearer <token>
```

The Nest app validates the token by calling:

```text
GET {API_URL}/user
```

Expected auth server response:

```json
{
  "data": {
    "id": "auth-user-id",
    "username": "username",
    "profile": {
      "name": "Display Name",
      "picture": "https://example.com/avatar.png",
      "gender": "female"
    }
  }
}
```

Users must still call `POST /users/initialize` before local user-backed features work.

### Behavior Changes

Invite handling is intentionally stricter than the Go backend:

```text
duplicate pending invites are rejected
accepted or rejected invites cannot be handled again
accepting an invite fails if either user is already in a couple
invite acceptance runs in a transaction
leaving a couple runs in a transaction
```

Notes are scoped to the authenticated user's current couple. A user without a couple cannot create, list, read, update, or delete notes.

### Response Changes

The response envelope remains consistent with the Go backend:

```json
{
  "error": false,
  "code": "success",
  "message": "Success",
  "data": null
}
```

DTO field names are now TypeScript/Nest-style camelCase. For example, use `createdAt` instead of `created_at`.

### Client Migration Checklist

```text
replace /user routes with /users routes
replace /user/invite routes with /invites routes
replace /todo routes with /notes routes
remove all client usage of completed on notes
switch response field reads from snake_case to camelCase
initialize the user with POST /users/initialize after auth
start with a fresh SQLite database
```

## Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

The app uses TypeORM schema synchronization against a fresh SQLite database.

## Environment

```text
PORT=8080
API_URL=http://localhost:8000
TIMEOUT_MS=5000
DATABASE_PATH=db.sqlite
NODE_ENV=development
```

## Routes

Public routes:

```text
GET /server/health
GET /server/version
```

Authenticated routes require `Authorization: Bearer <token>` and validate that token by calling `GET {API_URL}/user`.

```text
GET /users/me
POST /users/initialize

GET /couples/me
POST /couples/leave

GET /invites
POST /invites
PATCH /invites/:id

GET /notes
POST /notes
GET /notes/:id
PATCH /notes/:id
DELETE /notes/:id
```

## Response Shape

```json
{
  "error": false,
  "code": "success",
  "message": "Success",
  "data": null
}
```

Errors use the same envelope with `error: true`.

## Database

The schema is created by TypeORM synchronization. Core tables:

```text
users
couples
couple_members
invites
notes
```

`couple_members` replaces the old nullable `users.couple_id` column. This makes relationship state explicit and prevents users from being silently reassigned between couples.
