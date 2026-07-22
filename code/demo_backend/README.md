# HealthNest Demo Backend

This is a portfolio-only FastAPI + SQLite backend for the `portfolio-demo`
branch. It is intentionally separate from the production Supabase-backed API.

Demo state is stored in:

```text
code/demo_backend/healthnest_demo.sqlite
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
