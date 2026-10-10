# Development image for the React/Vite frontend (dev server with hot reload).
FROM node:24-alpine

WORKDIR /app

# Run as the unprivileged node user, which must own /app: tools write caches and temp files there.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY --chown=node:node . .

EXPOSE 5173

# Listen on all interfaces so the published port is reachable from the host browser.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
