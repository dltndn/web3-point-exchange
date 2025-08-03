import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { ethers } from 'ethers';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * Get blockchain provider status
   */
  @Get('provider/status')
  @ApiOperation({ summary: '블록체인 프로바이더 상태 확인' })
  @ApiResponse({ status: 200, description: '프로바이더 상태' })
  async getProviderStatus(): Promise<{ network: string; blockNumber: number }> {
    const provider = this.blockchainService.getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    return {
      network: network.name,
      blockNumber,
    };
  }
}
