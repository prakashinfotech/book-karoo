# ============================================================
# Dependencies
# ============================================================
FROM node:20 AS deps

WORKDIR /app

COPY package*.json ./

#RUN npm ci
RUN npm install --include=optional

# ============================================================
# Build
# ============================================================
FROM node:20 AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# ============================================================
# Runtime
# ============================================================
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/public ./public

COPY --from=build /app/.next/standalone ./

COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
