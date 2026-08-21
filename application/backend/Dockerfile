# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps
# Installs dependencies only. Kept as its own stage so Docker can cache this
# layer independently of source code changes - as long as package.json /
# package-lock.json don't change, this whole stage is reused from cache even
# if we edit src/ a hundred times. That's the single biggest Docker build
# speed win available to a Node app.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the manifest files first - NOT the source code. This is what
# makes the layer cache above actually work: Docker hashes each COPY'd file
# and invalidates every layer after the first one that changed.
COPY package.json package-lock.json ./

# --omit=dev: skip devDependencies (jest, eslint, nodemon, mongodb-memory-server,
# etc.) entirely - they have no business being in a production image; they
# bloat the image and widen the attack surface for no runtime benefit.
# npm ci (not npm install): installs exactly what package-lock.json says,
# fails if the lockfile and package.json are out of sync. Reproducible builds.
RUN npm ci --omit=dev


# ---------------------------------------------------------------------------
# Stage 2: runtime
# The actual image that ships. Starts fresh from a clean base rather than
# building on top of the deps stage, so nothing from the npm cache, npm
# itself beyond what's needed, or build-time-only files ends up in the final
# image.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# dumb-init: a tiny init process. Node.js does not reap zombie processes or
# forward signals (SIGTERM) correctly when run as PID 1 in a container -
# dumb-init fixes both. Without it, `docker stop` / Kubernetes SIGTERM can
# hang until the kill timeout, defeating the graceful shutdown we built into
# server.js.
RUN apk update && apk upgrade --no-cache && apk add --no-cache dumb-init

WORKDIR /app

# Create a dedicated non-root user. Running containers as root is a real
# security risk: if the app is ever compromised (e.g. via a dependency
# vulnerability), an attacker as root inside the container has a much easier
# path to escalate or pivot than as an unprivileged user.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Bring in production node_modules from the deps stage - not reinstalled,
# just copied, so we don't pay the npm install cost twice.
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup src ./src

# npm/npx/corepack/yarn nahi chahiye runtime mein - deps already install
# ho chuki hain deps stage mein, container sirf "node src/server.js" chalata hai
RUN rm -rf \
    /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /opt/yarn-v*
COPY --chown=appuser:appgroup package.json ./
COPY --chown=appuser:appgroup src ./src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck hits our own /health endpoint. Docker (and docker-compose
# depends_on: condition: service_healthy) uses this to know the container is
# not just "running" but actually serving traffic correctly.
# Using Node's built-in fetch instead of curl/wget keeps the image slim -
# no extra package needed just for a healthcheck.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

USER appuser

# dumb-init as PID 1, forwards signals to node correctly.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
