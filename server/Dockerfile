# Development image for the Express API.
FROM node:24-alpine

WORKDIR /app

# Run as the unprivileged node user, which must own /app: tools write caches and temp files there.
RUN chown node:node /app
USER node

# Install exact dependency versions from the lockfile (dev dependencies included,
# so migrations, tests and lint can run inside the container).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Application source. .env files, node_modules and coverage are excluded via .dockerignore;
# configuration comes from environment variables set in compose.yaml.
COPY --chown=node:node . .

ENV NODE_ENV=development \
    PORT=4000

EXPOSE 4000

# node --watch restarts the API on source changes where the host delivers file events (e.g. Linux).
# On Docker Desktop for Windows/macOS run `docker compose restart server` after backend edits.
CMD ["npm", "run", "dev"]
