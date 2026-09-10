# AI Code Review Backend

The AI Code Review Backend is a NestJS API for registering users, authenticating them with local credentials or Google OAuth, submitting source code for analysis, and storing structured AI-generated review results. It is the backend service for an AI Code Review application and exposes review history and individual review details for the authenticated user.

The service uses Prisma 7 with PostgreSQL for persistence and Groq for AI-powered code analysis. The deployed backend is available at [https://ai-review-code-be-production.up.railway.app/](https://ai-review-code-be-production.up.railway.app/).

**Contact:** youssibarani17@gmail.com

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database](#database)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [API Endpoint Summary](#api-endpoint-summary)
- [AI Code Review Flow](#ai-code-review-flow)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Usage Guide](#api-usage-guide)
- [End-to-End Example](#end-to-end-example)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Base URL](#api-base-url)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [Documentation Audit](#documentation-audit)

## Features

- Local user registration with bcrypt password hashing.
- Local email and password login.
- JWT session creation stored in an HTTP-only `access_token` cookie.
- Google OAuth 2.0 login and account linking through `UserAuthentication`.
- Authenticated current-user lookup.
- Cookie-based logout.
- Authenticated code review creation with AI analysis.
- Structured review results containing a score, summary, and severity-based issues.
- PostgreSQL persistence for users, reviews, and review issues through Prisma.
- Authenticated review listing with pagination.
- Authenticated review detail retrieval and deletion.
- Global request validation and CORS configuration.

The `users` resource and `ai` resource controllers are present, but the user CRUD methods are scaffold implementations and the AI controller does not expose routes. The production review workflow is handled by the `review` resource.

## Tech Stack

| Technology                                | Purpose                                   |
| ----------------------------------------- | ----------------------------------------- |
| NestJS 11                                 | Backend framework and application modules |
| TypeScript                                | Application programming language          |
| PostgreSQL                                | Relational database                       |
| Prisma 7                                  | ORM, generated client, and migrations     |
| `@prisma/adapter-pg`                      | PostgreSQL driver adapter for Prisma      |
| Passport                                  | Authentication strategy integration       |
| `passport-jwt`                            | JWT authentication strategy               |
| `passport-google-oauth20`                 | Google OAuth 2.0 strategy                 |
| `@nestjs/jwt`                             | JWT creation and verification             |
| `bcrypt`                                  | Password hashing and comparison           |
| Groq SDK                                  | AI provider client                        |
| Zod                                       | Validation of the structured AI response  |
| `class-validator` and `class-transformer` | DTO validation and query transformation   |
| Jest and Supertest                        | Unit and end-to-end testing tools         |

## Architecture

The application is organized into NestJS modules. Controllers define HTTP routes, services coordinate application behavior, repositories isolate Prisma queries, DTOs define validated input, and guards protect authenticated routes. `PrismaModule` is global and provides the database client to the rest of the application.

```mermaid
flowchart TD
    Client[Client] --> App[ NestJS Application ]
    App --> AuthController[AuthController]
    App --> ReviewController[ReviewController]
    App --> UsersController[UsersController]
    App --> RootController[AppController]
    AuthController --> AuthService
    ReviewController --> ReviewService
    ReviewService --> ReviewRepository
    ReviewService --> AiService
    AiService --> AiClient[Groq SDK]
    AuthService --> AuthRepository
    AuthService --> Jwt[JWT and Passport]
    AuthRepository --> Prisma[PrismaService]
    ReviewRepository --> Prisma
    Prisma --> PostgreSQL[(PostgreSQL)]
```

`ValidationPipe` is enabled globally with `whitelist: true` and `transform: true`. Cookies are parsed by `cookie-parser`, CORS allows credentials, and the application listens on `PORT` or port `3000` by default.

## Project Structure

```text
src/
├── ai/
│   ├── ai.client.ts
│   ├── ai.controller.ts
│   ├── ai.module.ts
│   ├── ai.service.ts
│   ├── dto/
│   └── schemas/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.repository.ts
│   ├── auth.service.ts
│   ├── decorator/
│   ├── dto/
│   ├── guard/
│   ├── google.strategy.ts
│   └── jwt.strategy.ts
├── generated/prisma/
├── prisma/
│   ├── prisma.controller.ts
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── review/
│   ├── dto/
│   ├── review.controller.ts
│   ├── review.module.ts
│   ├── review.repository.ts
│   └── review.service.ts
├── users/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
prisma/
├── migrations/
└── schema.prisma
test/
└── app.e2e-spec.ts
```

- `auth/` implements local authentication, Google OAuth, JWT verification, guards, and authentication persistence.
- `review/` owns review endpoints, pagination, review persistence, and the AI review orchestration.
- `ai/` wraps the Groq client and validates the structured review response with Zod.
- `prisma/` initializes Prisma with the PostgreSQL adapter.
- `users/` contains scaffold CRUD routes whose service methods currently return placeholder strings.
- `generated/prisma/` contains the generated Prisma client and types.
- `prisma/migrations/` contains database migrations.
- `test/` contains the end-to-end test configuration and e2e test file.

## Database

### Database Technology

The project uses PostgreSQL, requiring PostgreSQL 15 or newer according to `.env.example`. Prisma 7 is configured with the `prisma-client` generator and `@prisma/adapter-pg`. Migrations are stored in `prisma/migrations` and configured through `prisma7.config.ts`.

### Entity Overview

| Entity               | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `User`               | Stores local user identity and an optional password hash.                |
| `UserAuthentication` | Stores an external authentication identity, currently Google.            |
| `Review`             | Stores submitted source code and the resulting review summary and score. |
| `ReviewIssues`       | Stores individual issues identified during a review.                     |

### Database Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ USER_AUTHENTICATION : has
    USER ||--o{ REVIEW : creates
    REVIEW ||--o{ REVIEW_ISSUES : contains

    USER {
        string id PK
        string name
        string email UK
        string passwordHash "optional"
        datetime createdAt
        datetime updatedAt
    }

    USER_AUTHENTICATION {
        string id PK
        string userId FK
        enum provider
        string providerAccountId
        datetime createdAt
        datetime updatedAt
    }

    REVIEW {
        string id PK
        string userId FK
        text code
        string language
        enum status
        int score "optional"
        text summary "optional"
        datetime createdAt
        datetime updatedAt
    }

    REVIEW_ISSUES {
        string id PK
        string reviewId FK
        enum severity
        int line "optional"
        string title
        text description
        text suggestion "optional"
        datetime createdAt
    }
```

`User.email` is unique. `UserAuthentication` has a compound unique constraint on `provider` and `providerAccountId`. Deleting a user cascades to their authentication records and reviews; deleting a review cascades to its issues.

### Entity Details

#### `User`

| Field          | Type             | Required | Constraints / description                                         |
| -------------- | ---------------- | -------- | ----------------------------------------------------------------- |
| `id`           | `string`         | Yes      | UUID primary key.                                                 |
| `name`         | `string`         | Yes      | Display name.                                                     |
| `email`        | `string`         | Yes      | Unique email address.                                             |
| `passwordHash` | `string \| null` | No       | Bcrypt hash for local accounts; null for Google-created accounts. |
| `createdAt`    | `Date`           | Yes      | Creation timestamp.                                               |
| `updatedAt`    | `Date`           | Yes      | Automatically updated timestamp.                                  |

#### `UserAuthentication`

| Field               | Type           | Required | Constraints / description        |
| ------------------- | -------------- | -------- | -------------------------------- |
| `id`                | `string`       | Yes      | UUID primary key.                |
| `userId`            | `string`       | Yes      | Foreign key to `User.id`.        |
| `provider`          | `AuthProvider` | Yes      | Currently `GOOGLE`.              |
| `providerAccountId` | `string`       | Yes      | Provider account identifier.     |
| `createdAt`         | `Date`         | Yes      | Creation timestamp.              |
| `updatedAt`         | `Date`         | Yes      | Automatically updated timestamp. |

#### `Review`

| Field       | Type             | Required | Constraints / description                                                                                              |
| ----------- | ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`        | `string`         | Yes      | UUID primary key.                                                                                                      |
| `userId`    | `string`         | Yes      | Foreign key to `User.id`.                                                                                              |
| `code`      | `string`         | Yes      | Submitted source code, stored as text.                                                                                 |
| `language`  | `string`         | Yes      | Language label sent to the AI provider.                                                                                |
| `status`    | `ReviewStatus`   | Yes      | `PENDING`, `PROCESSING`, `COMPLETED`, or `FAILED`; creation uses `PENDING` and successful completion uses `COMPLETED`. |
| `score`     | `number \| null` | No       | AI score from 0 to 100.                                                                                                |
| `summary`   | `string \| null` | No       | AI-generated summary.                                                                                                  |
| `createdAt` | `Date`           | Yes      | Creation timestamp.                                                                                                    |
| `updatedAt` | `Date`           | Yes      | Automatically updated timestamp.                                                                                       |

#### `ReviewIssues`

| Field         | Type             | Required | Constraints / description                    |
| ------------- | ---------------- | -------- | -------------------------------------------- |
| `id`          | `string`         | Yes      | UUID primary key.                            |
| `reviewId`    | `string`         | Yes      | Foreign key to `Review.id`.                  |
| `severity`    | `Severity`       | Yes      | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.      |
| `line`        | `number \| null` | No       | Positive source line number when applicable. |
| `title`       | `string`         | Yes      | Short issue title.                           |
| `description` | `string`         | Yes      | Explanation of the issue.                    |
| `suggestion`  | `string \| null` | No       | Suggested improvement or fix.                |
| `createdAt`   | `Date`           | Yes      | Creation timestamp.                          |

## Authentication

### Local Authentication

`POST /auth/register` creates a local account. The password is hashed with bcrypt before persistence. `POST /auth/login` validates the email and password, signs a JWT containing the user ID as `sub`, and sets the token in an HTTP-only cookie named `access_token`. The cookie lasts one day and uses `secure: true` when `NODE_ENV=production`.

Protected routes use `JwtAuthGuard`. The JWT strategy reads only `request.cookies.access_token`, verifies it with `JWT_SECRET_KEY`, and exposes `{ sub: userId }` through the `CurrentUser` decorator. The implementation does not extract JWTs from the `Authorization: Bearer ...` header.

### Google OAuth

1. The client opens `GET /auth/google`.
2. `GoogleAuthGuard` redirects the browser to Google with `email` and `profile` scopes.
3. Google returns to `GET /auth/google/callback` using `GOOGLE_CALLBACK_URL`.
4. The service finds or creates the user and stores a `GOOGLE` provider identity in `UserAuthentication`.
5. The backend sets the same HTTP-only `access_token` cookie and redirects to `${FRONTEND_URL}/review`.

`POST /auth/logout` clears the access-token cookie. Authentication routes do not use a role-based authorization system.

## API Documentation

The API uses JSON request bodies where applicable. Dates in Prisma responses are serialized by NestJS as ISO date strings. The examples below are representative shapes based on the current implementation.

### Root API

#### `GET /`

Returns the literal application health-style response from `AppService`.

**Authentication:** Public

**Response:** `200 OK`

```text
Hello World!
```

### Authentication API

#### `POST /auth/register`

Creates a local user account.

**Authentication:** Public

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Request type:**

```ts
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}
```

`name` and `password` must be strings. `email` must pass email validation. The implementation does not define a minimum password length.

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "your data has been created",
  "Data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "passwordHash": "<bcrypt-hash>",
    "createdAt": "2026-09-11T10:00:00.000Z",
    "updatedAt": "2026-09-11T10:00:00.000Z"
  }
}
```

The current service returns the created Prisma user object, which includes the persisted `passwordHash`; clients should treat it as sensitive and the implementation should be reviewed before exposing this route publicly.

**Errors:** `409 Conflict` with `Email already exists` when the email is already registered; `400 Bad Request` for DTO validation failures.

#### `POST /auth/login`

Authenticates a local user and sets the JWT cookie.

**Authentication:** Public

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Request type:**

```ts
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "login successful"
}
```

The response body does not include the token. The server sets `Set-Cookie: access_token=<jwt>; HttpOnly; Max-Age=86400` with `Secure` enabled in production and `SameSite=Lax`.

**Errors:** `401 Unauthorized` with `Email not found` or `Incorrect password`.

#### `GET /auth/me`

Returns the authenticated user identified by the JWT cookie.

**Authentication:** Required through the `access_token` cookie.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "user found",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "passwordHash": "<bcrypt-hash>",
    "createdAt": "2026-09-11T10:00:00.000Z",
    "updatedAt": "2026-09-11T10:00:00.000Z"
  }
}
```

**Errors:** `401 Unauthorized` when the token is invalid or the user cannot be found.

#### `POST /auth/logout`

Clears the `access_token` cookie.

**Authentication:** Public

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `GET /auth/google`

Starts Google OAuth 2.0 authentication.

**Authentication:** Public, but handled by `GoogleAuthGuard`.

The route redirects the browser to Google. It does not return a JSON response when the guard successfully starts the OAuth flow.

#### `GET /auth/google/callback`

Handles the Google OAuth callback, sets the JWT cookie, and redirects to `${FRONTEND_URL}/review`.

**Authentication:** Public callback route handled by `GoogleAuthGuard`.

**Errors:** `401 Unauthorized` if the Google profile has no email address.

### Users API

These routes are registered by `UsersController` and are currently scaffold implementations. They do not read from or write to Prisma.

#### `POST /users`

Returns the placeholder string `This action adds a new user`.

**Authentication:** Public

**Response:** `201 Created`

```text
This action adds a new user
```

#### `GET /users`

Returns the placeholder string `This action returns all users`.

**Authentication:** Public

**Response:** `200 OK`

```text
This action returns all users
```

#### `GET /users/:id`

Returns a placeholder for the numeric conversion of `id`.

**Authentication:** Public

**Example:** `GET /users/7`

**Response:** `200 OK`

```text
This action returns a #7 user
```

#### `PATCH /users/:id`

Returns a placeholder for the numeric conversion of `id`.

**Authentication:** Public

**Example:** `PATCH /users/7`

**Response:** `200 OK`

```text
This action updates a #7 user
```

#### `DELETE /users/:id`

Returns a placeholder for the numeric conversion of `id`.

**Authentication:** Public

**Example:** `DELETE /users/7`

**Response:** `200 OK`

```text
This action removes a #7 user
```

### Reviews API

All review routes use `JwtAuthGuard` and scope database access to the authenticated user's ID.

#### `POST /review`

Creates a review, sends the submitted code to Groq, validates the structured response, persists the result and issues, and returns the stored review.

**Authentication:** Required through the `access_token` cookie.

**Request body:**

```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

**Request type:**

```ts
interface CreateReviewRequest {
  code: string;
  language: string;
}
```

Both fields must be non-empty strings.

**Response:** `201 Created`

```json
{
  "success": true,
  "message": "Your Data",
  "data": {
    "id": "review-uuid",
    "userId": "user-uuid",
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "status": "COMPLETED",
    "score": 92,
    "summary": "The function is concise and readable.",
    "createdAt": "2026-09-11T10:05:00.000Z",
    "updatedAt": "2026-09-11T10:05:04.000Z",
    "issues": [
      {
        "id": "issue-uuid",
        "reviewId": "review-uuid",
        "severity": "LOW",
        "line": 1,
        "title": "Missing input validation",
        "description": "The function does not validate its arguments.",
        "suggestion": "Validate that both arguments are numbers.",
        "createdAt": "2026-09-11T10:05:04.000Z"
      }
    ]
  }
}
```

**Response type:**

```ts
type ReviewStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ReviewIssueResponse {
  id: string;
  reviewId: string;
  severity: Severity;
  line: number | null;
  title: string;
  description: string;
  suggestion: string | null;
  createdAt: string;
}

interface ReviewResponse {
  id: string;
  userId: string;
  code: string;
  language: string;
  status: ReviewStatus;
  score: number | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  issues: ReviewIssueResponse[];
}
```

**Errors:** `400 Bad Request` for invalid input; `401 Unauthorized` for a missing or invalid cookie; `500 Internal Server Error` when the AI provider fails or returns an invalid result. On failure, the review is marked `FAILED` before the error is rethrown.

#### `GET /review`

Returns the authenticated user's reviews, newest first, including issues.

**Authentication:** Required through the `access_token` cookie.

**Query parameters:**

| Parameter | Type     | Required | Default | Constraints                     |
| --------- | -------- | -------- | ------- | ------------------------------- |
| `page`    | `number` | No       | `1`     | Integer, minimum `1`.           |
| `limit`   | `number` | No       | `10`    | Integer from `1` through `100`. |

**Example:** `GET /review?page=1&limit=10`

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Your Reviews",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

**Response type:**

```ts
interface ReviewListResponse {
  success: true;
  message: string;
  data: ReviewResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Errors:** `400 Bad Request` for invalid pagination values and `401 Unauthorized` for an invalid or missing cookie.

#### `GET /review/:id`

Returns one review belonging to the authenticated user, including its issues.

**Authentication:** Required through the `access_token` cookie.

**Path parameter:** `id` is the review UUID string.

**Response:** `200 OK` for a matching review.

```json
{
  "success": true,
  "message": "Your Data",
  "data": {
    "id": "review-uuid",
    "userId": "user-uuid",
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "status": "COMPLETED",
    "score": 92,
    "summary": "The function is concise and readable.",
    "createdAt": "2026-09-11T10:05:00.000Z",
    "updatedAt": "2026-09-11T10:05:04.000Z",
    "issues": []
  }
}
```

The service currently returns a `NotFoundException` instance instead of throwing it when no matching review exists. Therefore, the missing-review behavior should be verified and corrected before treating `404 Not Found` as a guaranteed response contract.

#### `DELETE /review/:id`

Deletes a review belonging to the authenticated user. The database cascade deletes its issues.

**Authentication:** Required through the `access_token` cookie.

**Path parameter:** `id` is the review UUID string.

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "your review deleted"
}
```

**Errors:** `404 Not Found` with `Review Not Found` when no review owned by the user matches the ID; `401 Unauthorized` for an invalid or missing cookie.

## API Endpoint Summary

| Method   | Endpoint                | Authentication | Description                                           |
| -------- | ----------------------- | -------------- | ----------------------------------------------------- |
| `GET`    | `/`                     | Public         | Returns `Hello World!`.                               |
| `POST`   | `/auth/register`        | Public         | Registers a local user.                               |
| `POST`   | `/auth/login`           | Public         | Logs in and sets the JWT cookie.                      |
| `GET`    | `/auth/me`              | JWT cookie     | Returns the current user.                             |
| `POST`   | `/auth/logout`          | Public         | Clears the JWT cookie.                                |
| `GET`    | `/auth/google`          | Google OAuth   | Starts Google login.                                  |
| `GET`    | `/auth/google/callback` | Google OAuth   | Completes Google login and redirects to the frontend. |
| `POST`   | `/users`                | Public         | Scaffold placeholder create route.                    |
| `GET`    | `/users`                | Public         | Scaffold placeholder list route.                      |
| `GET`    | `/users/:id`            | Public         | Scaffold placeholder detail route.                    |
| `PATCH`  | `/users/:id`            | Public         | Scaffold placeholder update route.                    |
| `DELETE` | `/users/:id`            | Public         | Scaffold placeholder delete route.                    |
| `POST`   | `/review`               | JWT cookie     | Runs and stores an AI code review.                    |
| `GET`    | `/review`               | JWT cookie     | Lists the current user's reviews with pagination.     |
| `GET`    | `/review/:id`           | JWT cookie     | Returns one owned review and its issues.              |
| `DELETE` | `/review/:id`           | JWT cookie     | Deletes one owned review.                             |

No HTTP routes are defined in `AiController` or `PrismaController` despite those controllers being registered in their modules.

## AI Code Review Flow

```mermaid
sequenceDiagram
    participant Client
    participant ReviewController
    participant ReviewService
    participant Prisma
    participant AiService
    participant Groq

    Client->>ReviewController: POST /review with code and language
    ReviewController->>ReviewService: Pass user ID and validated DTO
    ReviewService->>Prisma: Create PENDING review
    ReviewService->>AiService: reviewCode(code, language)
    AiService->>Groq: Send review prompt and JSON schema
    Groq-->>AiService: Structured JSON content
    AiService->>AiService: Parse JSON and validate with Zod
    AiService-->>ReviewService: score, summary, issues
    ReviewService->>Prisma: Transactionally set COMPLETED and create issues
    Prisma-->>ReviewService: Persisted review
    ReviewService-->>ReviewController: Load review with issues
    ReviewController-->>Client: JSON review response
```

The prompt asks Groq to inspect bugs, security, performance, code quality, maintainability, and best practices. The AI output must contain an integer score from 0 to 100, a summary, and issue objects with the supported severity values. The client model and Zod schema both reject invalid structured output. If the provider fails or the response is invalid, the review is marked `FAILED` and an internal server error is returned.

## Environment Variables

Create a `.env` file in the project root. `.env.example` documents the PostgreSQL connection string; the remaining variables are read directly by the application and are required for the corresponding features.

| Variable               | Required                     | Description                                                               |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes                          | PostgreSQL connection string. The project expects PostgreSQL 15 or newer. |
| `JWT_SECRET_KEY`       | Yes                          | Secret used to sign and verify JWTs.                                      |
| `AI_API_KEY`           | Yes for reviews              | Groq API key.                                                             |
| `AI_MODEL`             | Yes for reviews              | Groq model name passed to chat completions.                               |
| `GOOGLE_CLIENT_ID`     | Yes for Google OAuth         | Google OAuth client ID.                                                   |
| `GOOGLE_CLIENT_SECRET` | Yes for Google OAuth         | Google OAuth client secret.                                               |
| `GOOGLE_CALLBACK_URL`  | Yes for Google OAuth         | Registered Google OAuth callback URL.                                     |
| `FRONTEND_URL`         | Yes for frontend integration | Allowed CORS origin and Google callback redirect base.                    |
| `PORT`                 | No                           | HTTP port; defaults to `3000`.                                            |
| `NODE_ENV`             | No                           | Controls the secure cookie flag when set to `production`.                 |

Example placeholders:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET_KEY="your_jwt_secret"
AI_API_KEY="your_groq_api_key"
AI_MODEL="your_groq_model"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
FRONTEND_URL="http://localhost:3001"
PORT=3000
NODE_ENV=development
```

Never commit real credentials or API keys.

## Installation

### Prerequisites

- Node.js compatible with the project's TypeScript and NestJS toolchain.
- `pnpm`, which is the package manager used by the repository lockfile and setup instructions.
- PostgreSQL 15 or newer.
- A Groq API key and model name for code reviews.
- Google OAuth credentials if Google login is enabled.

### Clone and Install

```bash
git clone <repository-url>
cd <project-directory>
pnpm install
```

### Configure the Environment

```bash
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env`. Replace placeholders with real local values.

### Prepare the Database

Apply the committed Prisma migrations:

```bash
pnpm exec prisma migrate deploy
```

The repository also provides `pnpm run start:prod:migrate`, which deploys migrations and then starts the compiled application.

## Running the Application

| Command                       | Description                                                        |
| ----------------------------- | ------------------------------------------------------------------ |
| `pnpm run start`              | Starts NestJS normally.                                            |
| `pnpm run start:dev`          | Starts the development server in watch mode.                       |
| `pnpm run start:debug`        | Starts the development server in debug watch mode.                 |
| `pnpm run build`              | Compiles the application to `dist`.                                |
| `pnpm run start:prod`         | Starts `node dist/src/main` after a build.                         |
| `pnpm run start:prod:migrate` | Applies production migrations and starts the compiled application. |
| `pnpm run format`             | Formats TypeScript files under `src` and `test`.                   |
| `pnpm run lint`               | Runs ESLint with automatic fixes for configured TypeScript paths.  |

The local default base URL is `http://localhost:3000` unless `PORT` changes it.

## API Usage Guide

1. Register with `POST /auth/register`, or start Google login with `GET /auth/google`.
2. Log in with `POST /auth/login` to receive an HTTP-only `access_token` cookie.
3. Use a client that preserves cookies between requests. The API is configured for credentialed CORS.
4. Submit source code to `POST /review` with `code` and `language`.
5. Read the returned score, summary, and issues.
6. Use `GET /review` to retrieve paginated review history.
7. Use `GET /review/:id` or `DELETE /review/:id` for an individual owned review.
8. Call `POST /auth/logout` to clear the session cookie.

For browser clients, requests that rely on the cookie must use credentials, for example `fetch(url, { credentials: 'include' })`.

## End-to-End Example

### 1. Register

```http
POST http://localhost:3000/auth/register
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login and Preserve the Cookie

```http
POST http://localhost:3000/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

The response sets `access_token` as an HTTP-only cookie. A browser or API client must preserve that cookie for the next request.

### 3. Submit Code for Review

```http
POST http://localhost:3000/review
Content-Type: application/json
Cookie: access_token=<jwt>
```

```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

### 4. Receive the Review Result

```json
{
  "success": true,
  "message": "Your Data",
  "data": {
    "id": "review-uuid",
    "status": "COMPLETED",
    "score": 92,
    "summary": "The function is concise and readable.",
    "issues": []
  }
}
```

The complete response also contains `userId`, `code`, `language`, timestamps, and the complete issue records.

## Validation

The global `ValidationPipe` transforms and whitelists DTO input.

- Registration `name` and `password` must be strings.
- Registration `email` must be a valid email address.
- Review `code` and `language` must be non-empty strings.
- Review `page` is optional, converted to a number, and must be an integer of at least `1`.
- Review `limit` is optional, converted to a number, and must be an integer from `1` to `100`; its default is `10`.
- Unknown DTO properties are removed because `whitelist` is enabled.
- The login body is an inline TypeScript type rather than a class-validator DTO, so it has no explicit decorator-based validation rules.
- User CRUD DTOs are empty scaffold classes and do not define validation rules.

AI output has separate Zod validation: score is an integer from 0 to 100, severity is one of the four enum values, line is a positive integer or null, and issue text fields follow the schema.

## Error Handling

NestJS exceptions are used for known failures. Representative implemented errors include:

```json
{
  "statusCode": 401,
  "message": "Incorrect password",
  "error": "Unauthorized"
}
```

The exact standard NestJS error envelope can vary by exception and environment. Current application-level messages include:

- `409 Conflict`: `Email already exists`.
- `401 Unauthorized`: `Email not found`, `Incorrect password`, `User not found`, or missing Google profile email.
- `404 Not Found`: `Review Not Found` for review deletion when no owned review matches.
- `400 Bad Request`: DTO or pagination validation failures.
- `500 Internal Server Error`: AI communication failures, provider rate limits, empty responses, or invalid AI output.

The review creation path attempts to mark the review as `FAILED` before rethrowing an AI-related error. The current single-review service path returns a `NotFoundException` object rather than throwing it for a missing review, so that behavior is documented as an implementation caveat rather than a guaranteed 404 contract.

## Testing

The repository contains Jest unit specifications for the application, authentication, users, reviews, AI, and Prisma modules, plus an end-to-end test under `test/app.e2e-spec.ts`.

```bash
pnpm run test
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e
pnpm run test:debug
```

Tests are configured with Jest and `ts-jest`. The e2e configuration is stored in `test/jest-e2e.json`.

## Deployment

The repository does not contain a Dockerfile, Docker Compose file, or provider-specific deployment configuration. The package scripts include a production start command and a migration-aware production command:

```bash
pnpm run build
pnpm run start:prod
```

For a database-backed deployment, configure all required environment variables, provide PostgreSQL 15 or newer, and apply migrations with:

```bash
pnpm exec prisma migrate deploy
```

A deployed instance is available at [https://ai-review-code-be-production.up.railway.app/](https://ai-review-code-be-production.up.railway.app/). The repository itself does not document the Railway project configuration, so provider-specific infrastructure details are not asserted here.

## API Base URL

- Local: `http://localhost:3000` by default, or the value of `PORT`.
- Deployed: [https://ai-review-code-be-production.up.railway.app/](https://ai-review-code-be-production.up.railway.app/)

## Security

Implemented security mechanisms include:

- Bcrypt hashing for local account passwords.
- JWT signing and verification with `JWT_SECRET_KEY`.
- HTTP-only session cookie for the access token.
- Secure cookie flag in production.
- Passport JWT and Google OAuth guards.
- Ownership filtering for review reads and deletion by authenticated user ID.
- DTO validation and unknown-property whitelisting.
- Credentialed CORS with configured allowed origins.
- Secrets loaded from environment variables rather than source-controlled values.

The current registration response includes the Prisma user object and therefore may include `passwordHash`. This is a sensitive-data exposure risk that should be addressed before treating the registration endpoint as production-hardened.

## Future Improvements

The following are potential improvements and are not currently implemented:

- Add Swagger/OpenAPI documentation generated from the controllers and DTOs.
- Replace scaffold user CRUD routes with authenticated Prisma-backed operations.
- Add a dedicated login DTO with explicit email and password validation.
- Throw the missing-review exception correctly so the detail route returns a reliable 404.
- Remove `passwordHash` from public responses.
- Add rate limiting and stronger abuse protection around AI requests.
- Add structured logging, monitoring, and provider retry policies.
- Add more integration and e2e coverage for authentication, ownership, and AI failure paths.

## Documentation Audit

- Controllers analyzed: 6 (`AppController`, `AuthController`, `UsersController`, `ReviewController`, `AiController`, and `PrismaController`)
- Endpoints documented: 16
- Database entities analyzed: 4 (`User`, `UserAuthentication`, `Review`, `ReviewIssues`)
- Authentication: bcrypt local authentication, JWT cookie strategy, and Google OAuth 2.0
- AI provider: Groq SDK
- Database: PostgreSQL 15+
- ORM/ODM: Prisma 7 with `@prisma/adapter-pg`
