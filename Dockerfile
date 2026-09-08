# Single-stage: several routes read Markdown/MDX content off disk at
# request time (content/docs via node:fs, tutorial posts via
# extractToc()'s readFile — see src/features/docs/api/content.js and
# src/shared/api/toc.js), not just from the webpack/Turbopack bundle. A
# slimmer multi-stage image that copies out only .next/public would drop
# those directories and 404/500 on those routes at runtime. Copying the
# full checkout (same shape `pnpm build && pnpm start` already runs
# against in dev/CI) is the safe choice here over a smaller image.
FROM node:22-alpine
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ENV CI=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm-workspace.yaml's `allowBuilds` already allowlists the packages that
# need postinstall scripts (@astryxdesign/cli, sharp, ...) for local/dev
# installs, but a from-scratch Docker install still hits pnpm's newer
# "packages awaiting approval" gate — dangerouslyAllowAllBuilds sidesteps
# it. Acceptable here: dependency versions are pinned by pnpm-lock.yaml, so
# this build installs exactly what a local `pnpm install` would.
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

COPY . .
RUN pnpm build && node harness/checks/image-routes.mjs

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/login').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"
# -H 0.0.0.0: `next start`'s default host is not guaranteed to accept
# connections from outside the container's own network namespace, so the
# nginx service in docker-compose.prod.yml (a different container) needs it
# explicit rather than relying on the default.
CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
