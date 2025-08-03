# 1. Base Image: 의존성 설치
FROM node:20-alpine AS base
WORKDIR /app

# ARG 및 ENV로 환경변수 주입 (blockchain/Dockerfile 스타일 적용)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS
ARG NEXT_PUBLIC_POINT_MANAGER_ADDRESS

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
ENV NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS=${NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS}
ENV NEXT_PUBLIC_POINT_MANAGER_ADDRESS=${NEXT_PUBLIC_POINT_MANAGER_ADDRESS}

COPY package*.json ./
# node-gyp를 사용한 네이티브 모듈(utf-8-validate 등) 컴파일에 필요한 툴 설치
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install \
    && apk del .build-deps

# 2. Development Image: 개발용 이미지
# 소스 코드는 docker-compose.yml의 volumes를 통해 마운트 (Hot Reloading)
FROM base AS dev
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# 3. Production Build Image: 프로덕션용 빌드
FROM base AS build
COPY . .
RUN npm run build

# 4. Production Image: 최종 프로덕션 이미지
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# 런타임 환경변수는 base 스테이지에서 상속됨
ENV NODE_ENV=production
CMD ["npm", "start"]