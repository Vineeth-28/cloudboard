# syntax=docker/dockerfile:1

# No build stage needed - this is a plain static site (no bundler, no
# transpilation, see application/frontend/README.md for why). That means the
# Dockerfile is intentionally simple: copy static files onto an Nginx image.
FROM nginx:1.27-alpine

# Remove the default Nginx welcome config/content so it can't accidentally
# be served instead of ours.
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

EXPOSE 80

# The official nginx:alpine image already runs its worker processes
# (the ones that actually handle requests) as an unprivileged "nginx" user
# by default - only the master process starts as root, and only because it
# needs root to bind port 80 and manage worker processes. That's the
# standard, accepted pattern for Nginx containers; a fully non-root setup
# would mean binding a port >1024 or using the nginx-unprivileged image
# variant, which isn't necessary for a portfolio project on ports we control.

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
