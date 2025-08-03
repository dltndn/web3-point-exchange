import { ethers } from "hardhat";
import type { Log, Contract, Interface, LogDescription } from "ethers";
import axios from "axios";
import "dotenv/config";

// 환경변수 검증 및 안전한 타입 보장
const POINT_SERVER_ADDRESS = process.env.POINT_SERVER_ADDRESS;
const POINT_MANAGER_ADDRESS = process.env.POINT_MANAGER_ADDRESS;
const BASE_SEPOLIA_URL = process.env.BASE_SEPOLIA_URL;

if (!POINT_SERVER_ADDRESS || !POINT_MANAGER_ADDRESS || !BASE_SEPOLIA_URL) {
    console.error("필수 환경변수가 설정되지 않았습니다:");
    console.error("- POINT_SERVER_ADDRESS:", !!POINT_SERVER_ADDRESS);
    console.error("- POINT_MANAGER_ADDRESS:", !!POINT_MANAGER_ADDRESS);
    console.error("- BASE_SEPOLIA_URL:", !!BASE_SEPOLIA_URL);
    process.exit(1);
}

// 타입 안전성을 위한 환경변수 재할당
const VALIDATED_POINT_SERVER_ADDRESS: string = POINT_SERVER_ADDRESS;
const VALIDATED_POINT_MANAGER_ADDRESS: string = POINT_MANAGER_ADDRESS;
const VALIDATED_BASE_SEPOLIA_URL: string = BASE_SEPOLIA_URL;

// PointManager 컨트랙트 ABI에서 필요한 이벤트 정의
const POINT_MANAGER_ABI = [
    "event PointDeposited(address indexed account, uint256 amount, uint256 tokenAmount)",
    "event PointWithdrawn(address indexed account, uint256 amount, uint256 tokenAmount)",
    "event ValidUserSet(address indexed account, bool isValid)"
];

// API 요청 타입 정의
interface PointEventLog {
    wallet_address: string;
    point_amount: string;
    token_amount: string;
}

interface ValidUserEventLog {
    walletAddress: string;
    isValid: boolean;
}

interface ApiRequest {
    transaction_hash: string;
    event_logs: PointEventLog[];
}

interface ValidUserApiRequest {
    walletAddress: string;
    isValid: boolean;
}

interface ApiResponse {
    success: boolean;
    message?: string;
}

// 서버로 이벤트 전송
async function sendEventToServer(endpoint: string, data: ApiRequest): Promise<void> {
    try {
        const response = await axios.post<ApiResponse>(`${VALIDATED_POINT_SERVER_ADDRESS}${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10초 타임아웃
        });

        console.log(`✅ 이벤트 전송 성공 - ${endpoint}:`, {
            txHash: data.transaction_hash,
            eventCount: data.event_logs.length,
            response: response.data
        });
    } catch (error) {
        console.error(`❌ 이벤트 전송 실패 - ${endpoint}:`, {
            txHash: data.transaction_hash,
            eventCount: data.event_logs.length,
            error: error instanceof Error ? error.message : error
        });
        throw error;
    }
}

// ValidUserSet 이벤트를 서버로 전송
async function sendValidUserEventToServer(data: ValidUserApiRequest): Promise<void> {
    const endpoint = "/api/point/v1/user-points/validate-user";
    try {
        const response = await axios.post<ApiResponse>(`${VALIDATED_POINT_SERVER_ADDRESS}${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10초 타임아웃
        });

        console.log(`✅ ValidUserSet 이벤트 전송 성공:`, {
            walletAddress: data.walletAddress,
            isValid: data.isValid,
            response: response.data
        });
    } catch (error) {
        console.error(`❌ ValidUserSet 이벤트 전송 실패:`, {
            walletAddress: data.walletAddress,
            isValid: data.isValid,
            error: error instanceof Error ? error.message : error
        });
        throw error;
    }
}

// 이벤트 로그를 API 형식으로 변환
function parseEventLog(log: any, iface: any): PointEventLog {
    const parsedLog = iface.parseLog(log);
    if (!parsedLog) {
        throw new Error("이벤트 로그 파싱 실패");
    }

    return {
        wallet_address: parsedLog.args.account,
        point_amount: parsedLog.args.amount.toString(),
        token_amount: parsedLog.args.tokenAmount.toString()
    };
}

// ValidUserSet 이벤트 로그를 API 형식으로 변환
function parseValidUserEventLog(log: any, iface: any): ValidUserEventLog {
    const parsedLog = iface.parseLog(log);
    if (!parsedLog) {
        throw new Error("ValidUserSet 이벤트 로그 파싱 실패");
    }

    return {
        walletAddress: parsedLog.args.account,
        isValid: parsedLog.args.isValid
    };
}

// 같은 트랜잭션의 이벤트들을 그룹핑
function groupEventsByTransaction(logs: any[]): Map<string, any[]> {
    const groupedLogs = new Map<string, any[]>();
    
    for (const log of logs) {
        const txHash = log.transactionHash;
        if (!groupedLogs.has(txHash)) {
            groupedLogs.set(txHash, []);
        }
        groupedLogs.get(txHash)!.push(log);
    }
    
    return groupedLogs;
}

// 이벤트 처리 함수
async function processEvents(
    contract: any,
    fromBlock: number,
    toBlock: number
): Promise<void> {
    try {
        console.log(`🔍 이벤트 조회 중... 블록 범위: ${fromBlock} - ${toBlock}`);

        // PointDeposited, PointWithdrawn, ValidUserSet 이벤트 조회
        const [depositedLogs, withdrawnLogs, validUserLogs] = await Promise.all([
            contract.queryFilter("PointDeposited", fromBlock, toBlock),
            contract.queryFilter("PointWithdrawn", fromBlock, toBlock),
            contract.queryFilter("ValidUserSet", fromBlock, toBlock)
        ]);

        console.log(`📊 발견된 이벤트: PointDeposited(${depositedLogs.length}), PointWithdrawn(${withdrawnLogs.length}), ValidUserSet(${validUserLogs.length})`);

        // PointDeposited 이벤트 처리
        if (depositedLogs.length > 0) {
            const groupedDepositLogs = groupEventsByTransaction(depositedLogs);
            const iface = new ethers.Interface(POINT_MANAGER_ABI);

            for (const [txHash, logs] of groupedDepositLogs) {
                const eventLogs: PointEventLog[] = logs.map(log => parseEventLog(log, iface));
                
                const apiRequest: ApiRequest = {
                    transaction_hash: txHash,
                    event_logs: eventLogs
                };

                await sendEventToServer("/api/point/v1/point-to-token-transactions/process", apiRequest);
                
                // API 호출 간 간격 (rate limiting 방지)
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // PointWithdrawn 이벤트 처리
        if (withdrawnLogs.length > 0) {
            const groupedWithdrawLogs = groupEventsByTransaction(withdrawnLogs);
            const iface = new ethers.Interface(POINT_MANAGER_ABI);

            for (const [txHash, logs] of groupedWithdrawLogs) {
                const eventLogs: PointEventLog[] = logs.map(log => parseEventLog(log, iface));
                
                const apiRequest: ApiRequest = {
                    transaction_hash: txHash,
                    event_logs: eventLogs
                };

                await sendEventToServer("/api/point/v1/token-to-point-transactions/process", apiRequest);
                
                // API 호출 간 간격 (rate limiting 방지)
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // ValidUserSet 이벤트 처리
        if (validUserLogs.length > 0) {
            const iface = new ethers.Interface(POINT_MANAGER_ABI);

            for (const log of validUserLogs) {
                const validUserEvent = parseValidUserEventLog(log, iface);
                
                const apiRequest: ValidUserApiRequest = {
                    walletAddress: validUserEvent.walletAddress,
                    isValid: validUserEvent.isValid
                };

                await sendValidUserEventToServer(apiRequest);
                
                // API 호출 간 간격 (rate limiting 방지)
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

    } catch (error) {
        console.error("❌ 이벤트 처리 중 오류:", error);
        throw error;
    }
}

// 마지막 처리된 블록 번호 저장/로드 (간단한 파일 기반)
const fs = require('fs');
const path = require('path');
const LAST_BLOCK_FILE = path.join(__dirname, '.last_processed_block');

function getLastProcessedBlock(): number {
    try {
        if (fs.existsSync(LAST_BLOCK_FILE)) {
            const content = fs.readFileSync(LAST_BLOCK_FILE, 'utf8');
            return parseInt(content.trim()) || 0;
        }
    } catch (error) {
        console.warn("마지막 처리된 블록 번호 로드 실패:", error);
    }
    return 0;
}

function saveLastProcessedBlock(blockNumber: number): void {
    try {
        fs.writeFileSync(LAST_BLOCK_FILE, blockNumber.toString());
    } catch (error) {
        console.warn("마지막 처리된 블록 번호 저장 실패:", error);
    }
}

// Point Server 헬스체크 함수
async function checkPointServerHealth(): Promise<void> {
    console.log("🏥 Point Server 헬스체크 시작...");
    console.log(`📍 서버 주소: ${VALIDATED_POINT_SERVER_ADDRESS}`);
    
    const MAX_RETRIES = 36; // 최대 36번 시도 (3분)
    const RETRY_INTERVAL = 5000; // 5초 간격
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`🔍 헬스체크 시도 ${attempt}/${MAX_RETRIES}...`);
            
            // 헬스체크 엔드포인트 호출
            const response = await axios.get(`${VALIDATED_POINT_SERVER_ADDRESS}/health`, {
                timeout: 10000, // 10초 타임아웃
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                console.log("✅ Point Server 헬스체크 성공!");
                console.log(`📊 응답 상태: ${response.status}`);
                if (response.data) {
                    console.log(`📋 응답 데이터:`, response.data);
                }
                return; // 성공 시 함수 종료
            } else {
                console.warn(`⚠️ 예상치 못한 응답 상태: ${response.status}`);
            }
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    console.log(`⏳ Point Server가 아직 준비되지 않음 (연결 거부)`);
                } else if (error.code === 'ETIMEDOUT') {
                    console.log(`⏳ Point Server 응답 타임아웃`);
                } else {
                    console.log(`⏳ Point Server 연결 실패: ${error.message}`);
                }
            } else {
                console.log(`⏳ 헬스체크 오류: ${error instanceof Error ? error.message : error}`);
            }
        }
        
        // 마지막 시도가 아니면 대기
        if (attempt < MAX_RETRIES) {
            console.log(`⏰ ${RETRY_INTERVAL / 1000}초 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
    }
    
    // 모든 시도 실패 시
    console.error(`❌ Point Server 헬스체크 실패 (${MAX_RETRIES}회 시도)`);
    console.error("Point Server가 준비되지 않았거나 연결할 수 없습니다.");
    console.error("환경변수와 네트워크 설정을 확인해주세요.");
    process.exit(1);
}

// 메인 이벤트 폴링 함수
async function startEventPolling(): Promise<void> {
    console.log("🚀 이벤트 폴링 시작");
    console.log("📋 설정:");
    console.log(`  - Point Server: ${VALIDATED_POINT_SERVER_ADDRESS}`);
    console.log(`  - Contract Address: ${VALIDATED_POINT_MANAGER_ADDRESS}`);
    console.log(`  - Network: Base Sepolia`);

    // Provider 설정
    const provider = new ethers.JsonRpcProvider(VALIDATED_BASE_SEPOLIA_URL);
    
    // Contract 인스턴스 생성
    const contract = new ethers.Contract(
        VALIDATED_POINT_MANAGER_ADDRESS,
        POINT_MANAGER_ABI,
        provider
    );

    // 마지막 처리된 블록 번호 로드
    let lastProcessedBlock = getLastProcessedBlock();
    
    // 처음 실행이라면 현재 블록에서 시작
    if (lastProcessedBlock === 0) {
        lastProcessedBlock = await provider.getBlockNumber();
        console.log(`📍 첫 실행: 현재 블록(${lastProcessedBlock})부터 시작`);
    } else {
        console.log(`📍 마지막 처리된 블록: ${lastProcessedBlock}`);
    }

    // 폴링 루프
    const BLOCK_BATCH_SIZE = 100; // 한 번에 처리할 블록 수
    const POLLING_INTERVAL = 3000; // 3초마다 폴링

    while (true) {
        try {
            const currentBlock = await provider.getBlockNumber();
            
            if (currentBlock > lastProcessedBlock) {
                const toBlock = Math.min(
                    currentBlock,
                    lastProcessedBlock + BLOCK_BATCH_SIZE
                );

                console.log(`\n⏰ ${new Date().toISOString()} - 새로운 블록 감지`);
                
                await processEvents(contract, lastProcessedBlock + 1, toBlock);
                
                lastProcessedBlock = toBlock;
                saveLastProcessedBlock(lastProcessedBlock);
                
                console.log(`✅ 블록 ${toBlock}까지 처리 완료`);
            } else {
                console.log(`⌛ 새로운 블록 대기 중... (현재: ${currentBlock})`);
            }

        } catch (error) {
            console.error("❌ 폴링 중 오류:", error);
            
            // 네트워크 오류 등의 경우 잠시 대기 후 재시도
            console.log("🔄 30초 후 재시도...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
        }

        // 다음 폴링까지 대기
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
}

// 스크립트 실행
if (require.main === module) {
    console.log("🚀 블록체인 이벤트 폴링 서비스 시작");
    console.log("📋 설정 정보:");
    console.log(`  - Point Server: ${VALIDATED_POINT_SERVER_ADDRESS}`);
    console.log(`  - Contract Address: ${VALIDATED_POINT_MANAGER_ADDRESS}`);
    console.log(`  - Network: Base Sepolia`);
    console.log(`  - RPC URL: ${VALIDATED_BASE_SEPOLIA_URL}`);
    console.log("");
    
    // 헬스체크 먼저 실행 후 이벤트 폴링 시작
    checkPointServerHealth()
        .then(() => {
            console.log("🌐 이벤트 폴링 시작...");
            return startEventPolling();
        })
        .catch(error => {
            console.error("❌ 서비스 실행 실패:", error);
            process.exit(1);
        });
}

export { startEventPolling };
