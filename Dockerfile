# Builds the sites, then leaves only what it takes to serve them.

FROM oven/bun:1 AS build
WORKDIR /app

# Dependencies first, so a change to the sites alone doesn't fetch them all again.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Everything the sites depend on is bundled into the build, so the server needs nothing installed beside it.
FROM node:24-alpine
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node
CMD ["node", "build"]
