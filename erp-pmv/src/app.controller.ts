// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      version: '1.0',
      timestamp: new Date().toISOString(),
    };
  }
}