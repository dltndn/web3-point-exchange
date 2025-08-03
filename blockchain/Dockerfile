# Node.js LTS 버전 사용
FROM node:20-alpine

# 시스템 패키지 업데이트 및 개발 도구 설치
RUN apk add --no-cache bash \
    git \
    python3 \
    make \
    g++ \
    curl

# 작업 디렉토리 설정
WORKDIR /app/blockchain

# 환경변수 주입을 위한 ARG 선언
ARG POINT_SERVER_ADDRESS
ARG POINT_MANAGER_ADDRESS
ARG BASE_SEPOLIA_URL
ARG PRIVATE_KEY
ARG BASESCAN_API_KEY

# ARG를 ENV로 변환하여 런타임에서 사용 가능하도록 설정
ENV POINT_SERVER_ADDRESS=${POINT_SERVER_ADDRESS}
ENV POINT_MANAGER_ADDRESS=${POINT_MANAGER_ADDRESS}
ENV BASE_SEPOLIA_URL=${BASE_SEPOLIA_URL}
ENV PRIVATE_KEY=${PRIVATE_KEY}
ENV BASESCAN_API_KEY=${BASESCAN_API_KEY}

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 스크립트 파일을 먼저 복사하고 권한 설정
COPY create-env.sh /app/blockchain/create-env.sh

# 나머지 소스 코드 복사
COPY . .

# 스크립트 실행 권한 설정 (마지막에 수행하여 권한이 덮어쓰여지지 않도록)
RUN chmod 755 /app/blockchain/create-env.sh && \
    ls -la /app/blockchain/create-env.sh

# hardhat 컴파일 및 이벤트 폴링 실행
ENTRYPOINT ["/bin/bash", "-c", "chmod +x /app/blockchain/create-env.sh && /bin/bash /app/blockchain/create-env.sh && npx hardhat compile && npx hardhat run scripts/eventPollingToPointServer.ts --network baseSepolia"]