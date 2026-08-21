# CloudBoard Frontend

A plain HTML/CSS/vanilla-JS static site - no build step, no framework runtime.

## Why not React?

The project brief allows either "React or simple frontend." A static site was
chosen deliberately: the point of this project is the DevOps pipeline, not
frontend tooling. A static site means:

- No JS build stage to containerize, cache, or explain twice (once for app
  logic, once for the build tool).
- The Docker image for this service is just Nginx + static files - a clean,
  minimal example of a production frontend image.
- Fewer moving parts to break in CI/CD while learning Docker, Kubernetes, and
  Helm for the first time.

The trade-off: no component reactivity, no client-side routing, no JSX. For a
three-endpoint demo UI, that trade-off is worth it. In a real product, React
(or another framework) would very likely be the right call once the UI grows
past a form and a list.

## Files

```
public/
├── index.html   # markup
├── style.css    # styling
└── app.js       # fetch() calls to /health and /api/users
```

## Local development

Requests go to relative paths (`/api/users`, `/health`) - so this needs
something in front of it proxying those paths to the backend. Options:

```bash
# Quick static preview only (API calls will fail without a proxy):
cd public && python3 -m http.server 8080

# Full working setup (frontend + backend + proxy + database):
# see docker-compose.yml in Phase 3
```
