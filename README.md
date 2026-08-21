# CloudBoard

[![CI](https://github.com/OWNER/cloudboard/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/cloudboard/actions/workflows/ci.yml)

> A minimal user-directory service, built to demonstrate a realistic, production-style
> DevOps delivery pipeline — from `git push` to a monitored, logged, rolling-updated
> deployment on Kubernetes.

**Status:** 🚧 Work in progress — this README is a placeholder scaffold from Phase 1.
The full documentation (architecture diagrams, setup instructions, runbooks) is written
in Phase 17 once every layer below actually exists.

## Why this project exists

The application itself is intentionally simple (a Node.js/Express API backed by
MongoDB, with a small React frontend). The point of CloudBoard is not the app —
it's everything around it: containerization, CI/CD, infrastructure-as-code,
orchestration, observability, and security practices, built the way a small
engineering team would actually build them.

## Project structure

```text
cloudboard/
├── application/          # Frontend (React) and backend (Node/Express + MongoDB) source
│   ├── frontend/
│   └── backend/
├── docker/                # Standalone Dockerfiles / compose-related assets
├── kubernetes/            # Raw K8s manifests
│   ├── base/               # Shared, environment-agnostic resources (kustomize base)
│   └── environments/       # Per-environment overlays
│       ├── dev/
│       └── prod/
├── helm/                  # Helm chart wrapping the Kubernetes manifests
│   └── application/
├── terraform/              # AWS infrastructure as code
│   ├── modules/             # Reusable building blocks (vpc, security-group, ecr, eks)
│   └── environments/        # Per-environment root configs (dev, prod) with their own state
├── ansible/                # Configuration management for non-Kubernetes hosts
│   ├── inventory/
│   ├── playbooks/
│   └── roles/
│       ├── common/           # Base hardening, users, packages
│       ├── docker/           # Docker Engine install/config
│       └── nginx/            # Reverse proxy setup
├── monitoring/              # Prometheus + Grafana configuration
├── logging/                 # Loki + Promtail configuration
├── scripts/                 # One-off / helper automation scripts
├── .github/workflows/       # CI and CD pipelines (GitHub Actions)
├── Jenkinsfile               # Parallel CD pipeline implementation (comparison exercise)
└── docs/
    ├── troubleshooting.md    # Debugging playbooks for common failure scenarios
    └── adr/                  # Architecture Decision Records
```

## Local development (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend health check: http://localhost:8080/health (proxied through Nginx)
- MongoDB (if you want to connect directly): localhost:27017

```bash
docker compose down          # stop and remove containers
docker compose down -v       # also wipe the MongoDB data volume
docker compose logs -f backend
docker compose exec backend sh
```

## CI Pipeline

Every pull request and every push to `main` triggers `.github/workflows/ci.yml`:

1. **Lint & Test** — installs backend dependencies, runs ESLint, runs the Jest suite.
2. **Docker Build & Security Scan** — only runs if step 1 passes. Builds both the
   backend and frontend images with Buildx, then scans each with
   [Trivy](https://github.com/aquasecurity/trivy) for CRITICAL/HIGH vulnerabilities.
   A vulnerable image fails the pipeline before it ever reaches a registry.

See the workflow file itself for the full reasoning behind each step.

## Roadmap (build phases)

- [x] Phase 2 — Application (Node/Express + MongoDB)
- [x] Phase 3 — Docker & Docker Compose
- [x] Phase 4 — CI pipeline (GitHub Actions)
- [ ] Phase 5 — Container registry (AWS ECR)
- [ ] Phase 6 — Terraform infrastructure
- [ ] Phase 7 — Ansible configuration management
- [ ] Phase 8 — Kubernetes manifests
- [ ] Phase 9 — Helm chart
- [ ] Phase 10 — CD pipeline
- [ ] Phase 11 — Jenkins pipeline
- [ ] Phase 12 — Monitoring (Prometheus/Grafana)
- [ ] Phase 13 — Logging (Loki/Promtail)
- [ ] Phase 14 — Security hardening pass
- [ ] Phase 15 — Deployment strategies (rolling, blue-green)
- [ ] Phase 16 — Troubleshooting documentation
- [ ] Phase 17 — Final documentation & architecture diagrams

## License

MIT — see [LICENSE](./LICENSE).
