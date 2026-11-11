FROM node:26-bookworm-slim

ENV NODE_ENV=production \
    FC_LOCAL_DATA=/var/lib/fate-covenant/realm-2 \
    FC_ADMIN_LISTEN_HOST=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY . .

RUN mkdir -p /var/lib/fate-covenant/realm-2 \
    && chown -R node:node /app /var/lib/fate-covenant

USER node

EXPOSE 18880 18881 18882 18883 19090
VOLUME ["/var/lib/fate-covenant/realm-2"]

CMD ["node", "local-server.mjs", "--public"]

