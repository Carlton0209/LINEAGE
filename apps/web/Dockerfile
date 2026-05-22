FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/manifest-schema/package.json packages/manifest-schema/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

EXPOSE 3000

CMD ["pnpm", "--filter", "@lineage/web", "dev"]
