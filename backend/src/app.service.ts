import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      success: true,
      message: 'E-Commerce API is running successfully 🚀',
      version: '0.0.1alpha',
      status: 200,
      timestamp: new Date().toISOString(),
    };
  }
}