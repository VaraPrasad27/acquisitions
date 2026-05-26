# Acquisitions API Docker Setup (Neon Local + Neon Cloud)
This project supports two containerized modes:
- Development: app container + Neon Local proxy container
- Production: app container only, connected directly to Neon Cloud
## Files added for Dockerization
- `Dockerfile`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `.env.development`
- `.env.production`
## 1) Development (local) with Neon Local
Neon Local runs as a Docker service and automatically creates ephemeral Neon branches when the container starts. The app connects to Neon Local via `DATABASE_URL`.
### Configure development environment
Edit `.env.development`:
- Set `NEON_API_KEY`
- Set `NEON_PROJECT_ID`
- Optionally set `PARENT_BRANCH_ID` if you want a specific parent branch for each ephemeral branch
The app uses:
- `DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions_dev?sslmode=require`
### Start development stack
```bash
docker compose -f docker-compose.dev.yml up --build
```
### Run migrations against Neon Local (fresh ephemeral branches)
In a second terminal:
```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```
Your API is available at `http://localhost:3000`.
## 2) Production with Neon Cloud
In production, Neon is managed externally in Neon Cloud. No Neon Local proxy/container is used.
### Configure production environment
Edit `.env.production`:
- Set `DATABASE_URL` to your real Neon Cloud URL (`...neon.tech...`)
- Set secure values for `JWT_SECRET`, `ARCJET_KEY`, and other app secrets
### Start production app container
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
The app reads `DATABASE_URL` from `.env.production` and connects directly to Neon Cloud.
## DATABASE_URL switching between environments
- Development (`docker-compose.dev.yml` + `.env.development`):
  - `DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions_dev?sslmode=require`
- Production (`docker-compose.prod.yml` + `.env.production`):
  - `DATABASE_URL=postgres://...neon.tech...`
Use Docker Compose file + env file pair to switch behavior cleanly without code changes.
