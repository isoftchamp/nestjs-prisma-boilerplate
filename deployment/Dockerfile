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

COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --frozen-lockfile --production --ignore-scripts && yarn cache clean

FROM node:krypton-alpine AS runtime

LABEL version="1.0"
LABEL description="NestJS API runtime image"

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /app/build ./build
COPY --chown=node:node package.json ./

RUN mkdir -p /app/logs && chown node:node /app/logs

USER node

EXPOSE 5100

CMD ["node", "build/web.js"]
