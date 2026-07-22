# HealthNest Demo Backend

This is a portfolio-only FastAPI + SQLite backend for the `portfolio-demo`
branch. It is intentionally separate from the production Supabase-backed API.

Demo state is stored in:

```text
code/demo_backend/healthnest_demo.sqlite
```

In production, set `DEMO_DB_PATH` so SQLite writes to a persistent disk:

```text
DEMO_DB_PATH=/var/data/healthnest_demo.sqlite
```

Schema and fictional seed data live in:

```text
code/demo_backend/migrations/001_demo_schema_and_seed.sql
```

Run locally:

```bash
cd code/demo_backend
python -m uvicorn app:app --reload --port 8001
```

Then run the frontend and open it with `?demo`:

```bash
cd code/frontend
npm run dev
```

```text
http://127.0.0.1:5173/?demo
```

The backend applies migrations on startup. Delete `healthnest_demo.sqlite` to
reset the demo to seeded data.

## Render Deployment

The repository root includes a demo-specific `Dockerfile` and `render.yaml`.
This deploys HealthNest as a single Render Web Service:

- React is built with `VITE_HEALTHNEST_DEMO=true`.
- FastAPI serves the compiled React app and API routes from the same origin.
- SQLite stores demo changes at `/var/data/healthnest_demo.sqlite`.
- Render attaches a 1 GB persistent disk at `/var/data`.

Use Render's Blueprint flow or create a Docker Web Service manually from the
`portfolio-demo` branch. Persistent disks require a paid Render instance.
