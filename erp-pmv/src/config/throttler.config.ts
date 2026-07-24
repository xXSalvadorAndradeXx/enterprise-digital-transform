import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.THROTTLER_TTL || '60000', 10),
  limit: parseInt(process.env.THROTTLER_LIMIT || '60', 10),
  authTtl: parseInt(process.env.THROTTLER_AUTH_TTL || '900000', 10),
  authLimit: parseInt(process.env.THROTTLER_AUTH_LIMIT || '5', 10),
}));