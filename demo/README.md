# Demo Assets

The Iteration 3 presentation and code walkthrough videos are provided as GitHub Release assets. They are kept out of the Git repository because the video files exceed GitHub's normal per-file push limit.

Expected release media:

- `iteration-3-presentation-with-demo.mp4`
- `code-walkthrough.mov`

## Portfolio Demo Branch

The `portfolio-demo` branch includes a public, no-login demo mode for portfolio
links. Demo-specific SQLite backend code lives under:

```text
code/demo_backend/
```

Demo-specific frontend entry UI lives under:

```text
code/frontend/src/demo/
```

Start the SQLite demo backend first:

```bash
cd code/demo_backend
python -m uvicorn app:app --reload --port 8001
```

Then run the frontend:

```bash
cd code/frontend
npm run dev
```

Then open the local Vite URL with `?demo`, for example:

```text
http://localhost:5173/?demo
```

The demo uses fictional patient/provider data and does not require the FastAPI
production backend, Supabase, credentials, or protected health information.
Messages, availability, and appointments are stored in the local SQLite demo
database.
