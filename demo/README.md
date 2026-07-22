# Demo Assets

The Iteration 3 presentation and code walkthrough videos are provided as GitHub Release assets. They are kept out of the Git repository because the video files exceed GitHub's normal per-file push limit.

Expected release media:

- `iteration-3-presentation-with-demo.mp4`
- `code-walkthrough.mov`

## Portfolio Demo Branch

The `portfolio-demo` branch includes a public, no-login demo mode for portfolio
links. Demo-specific data and request handling live under:

```text
code/frontend/src/demo/
```

To run the portfolio demo locally:

```bash
cd code/frontend
npm run dev
```

Then open the local Vite URL with `?demo`, for example:

```text
http://localhost:5173/?demo
```

The demo uses fictional patient/provider data and does not require the FastAPI
backend, Supabase, credentials, or protected health information.
