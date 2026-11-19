FROM node:krypton-alpine AS dependencies

WORKDIR /app

COPY ["package.json", "yarn.lock", "prisma.config.ts", "./"]
COPY prisma ./prisma
RUN yarn install --frozen-lockfile

FROM dependencies AS builder

WORKDIR /app

COPY . .
RUN yarn build

FROM node:krypton-alpine AS production-dependencies

WORKDIR /app

ENV NODE_ENV=production

COPY ["package.json", "yarn.lock", "./"]
RUN node -e "const fs=require('fs');const p=require('./package.json');fs.writeFileSync('package.json',JSON.stringify({name:p.name,version:p.version,private:p.private,type:p.type,dependencies:p.dependencies},null,2)+'\\n')" \
    && yarn install --frozen-lockfile --production=true --ignore-scripts --non-interactive \
    && test ! -e node_modules/.bin/tsc \
    && test ! -e node_modules/.bin/prisma \
    && yarn cache clean

FROM node:krypton-alpine AS runtime

LABEL version="1.0"
LABEL description="NestJS API runtime image"

ENV NODE_ENV=production
ENV HEALTHCHECK_PORT=5100

WORKDIR /app

COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/build ./build
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=production-dependencies /app/package.json ./

RUN mkdir -p /app/logs && chown node:node /app/logs

USER node

EXPOSE 5100

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.HEALTHCHECK_PORT + '/healthcheck').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "build/web.js"]
