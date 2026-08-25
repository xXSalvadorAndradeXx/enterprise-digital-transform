import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  constructor(private readonly configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    const saltRoundsStr =
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') ||
      this.configService.get<string>('SALT_ROUNDS') ||
      '10';
    const saltRounds = parseInt(saltRoundsStr, 10);
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
