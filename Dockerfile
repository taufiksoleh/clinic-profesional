# Build with `npm ci && npm run build` against the migrated database first.
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
COPY --chown=node:node public ./public
RUN mkdir -p media && chown node:node media
USER node
EXPOSE 3000
CMD ["node", "server.js"]
