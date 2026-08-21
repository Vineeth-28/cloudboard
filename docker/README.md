# docker/

This directory is intentionally light. Each service's `Dockerfile` and
`.dockerignore` live next to its own source code instead of being
centralized here:

```
application/backend/Dockerfile
application/backend/.dockerignore
application/frontend/Dockerfile
application/frontend/.dockerignore
application/frontend/nginx.conf
```

**Why co-locate instead of centralizing here?** A Dockerfile's build context
is usually the directory it builds - keeping it next to the code it
packages means the `COPY` paths inside it stay short and obvious, and
anyone opening `application/backend/` immediately sees how that service is
containerized, without needing to know a parallel `docker/` folder exists.

The root [`docker-compose.yml`](../docker-compose.yml) references both
Dockerfiles via their `build.context` and wires the resulting containers
together (frontend, backend, MongoDB) for local development.

If a project outgrows this (e.g. many services, or Dockerfiles shared across
services), centralizing here becomes the better trade-off - worth
revisiting if this project's shape changes.
