# 1. Base Image: 의존성 설치
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 2. Development Image: 개발용 이미지
FROM base AS dev
ENV NODE_ENV=development
CMD ["npm", "run", "start:dev"]

# 3. Production Build Image: 프로덕션용 빌드
FROM base AS build
COPY . .
RUN npm run build

# 4. Production Image: 최종 프로덕션 이미지
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
ENV NODE_ENV=production
CMD ["node", "dist/main"]