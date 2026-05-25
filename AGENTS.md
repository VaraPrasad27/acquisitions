# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository status and source-of-truth docs
- There is currently no `README.md`, `WARP.md`, or prior `AGENTS.md`.
- No Claude/Cursor/Copilot instruction files were found (`CLAUDE.md`, `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`).
- Treat `package.json`, `drizzle.config.js`, and the `src/` tree as the primary source of truth.

## Development commands
Run all commands from the repository root.
- Install dependencies: `npm install`
- Start local development server (Node watch mode): `npm run dev`
- Lint: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`
- Format all files: `npm run format`
- Check formatting: `npm run format:check`
- Generate Drizzle migration files from schema: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`

## Tests in current state
- No test script and no test files currently exist in the repository.
- There is no established single-test command yet.
- If tests are introduced, add explicit npm scripts (for example, `test` and `test:single`) so future agents can run full and single-test workflows consistently.

## Runtime and environment
- App entrypoint: `src/index.js` (loads env via `dotenv/config` and then starts `src/server.js`).
- Server listens on `PORT` (defaults to `3000`) in `src/server.js`.
- Required environment values inferred from code:
  - `DATABASE_URL` (database client and Drizzle migrations)
  - `JWT_SECRET` (JWT signing/verification; currently has a weak fallback in code)
  - `PORT`, `NODE_ENV`, `LOG_LEVEL`
- `.env.expamle` exists but is misspelled; check/update when adjusting env setup.

## High-level architecture
This is an Express 5 API with a layered auth flow:

1. **Bootstrap**
   - `src/index.js` loads env and imports `src/server.js`.
   - `src/server.js` imports `app` and starts the HTTP listener.

2. **App and middleware composition**
   - `src/app.js` wires middleware: `helmet`, `cors`, JSON/urlencoded parsers, `cookie-parser`, and `morgan`.
   - Morgan writes through Winston (`src/config/logger.js`).
   - Health/basic routes are in `app.js`; feature routes mount under `/api/*`.

3. **Route → controller → service**
   - Routes in `src/routes/auth.routes.js` delegate to controllers.
   - `signup` controller (`src/controllers/auth.controller.js`) validates input with Zod, calls service layer, signs JWT, and writes cookie.
   - Service layer (`src/services/auth.service.js`) owns business logic and DB interaction.

4. **Data/model layer**
   - Drizzle schema lives in `src/models/*.js` (currently `user.model.js`).
   - DB connection is configured in `src/config/database.js` using Neon serverless + Drizzle.
   - Migration output is stored in `drizzle/`, configured by `drizzle.config.js`.

5. **Cross-cutting utilities**
   - `src/validations/` contains Zod schemas.
   - `src/utils/jwt.js` handles token sign/verify.
   - `src/utils/cookies.js` centralizes cookie options and set/clear/get helpers.
   - `src/utils/format.js` formats validation errors for API responses.

## Import alias conventions
`package.json` defines Node `imports` aliases:
- `#config/*`, `#controllers/*`, `#models/*`, `#routes/*`, `#services/*`, `#utils/*`, `#validations/*`

Prefer these aliases over long relative paths when editing or adding modules.

## Important implementation notes for future edits
- Keep feature logic in the existing layered pattern (route -> controller -> service -> model/DB).
- When changing DB schema in `src/models`, generate a migration (`npm run db:generate`) and apply it (`npm run db:migrate`).
- Logging is expected to go through Winston (`src/config/logger.js`), with files under `logs/`.
