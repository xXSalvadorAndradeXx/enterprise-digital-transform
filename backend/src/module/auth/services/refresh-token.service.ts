import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  async revokeAllUserTokens(userId: string): Promise<void> {
    this.logger.log(`[REFRESH TOKEN MOCK] Revocando todos los refresh tokens activos para el usuario: ${userId}`);
  }
}
