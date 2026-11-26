import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '5000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'peoplecore_access_jwt_secret_default_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'peoplecore_refresh_jwt_secret_default_key',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
  pythonApiKey: process.env.PYTHON_API_KEY || 'peoplecore_internal_python_service_secret_token_2026',
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    maxSizeMb: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '15', 10),
  },
  bankExport: {
    routingNumber: process.env.BANK_EXPORT_ROUTING_NUMBER || '123456789',
    companyId: process.env.BANK_EXPORT_COMPANY_ID || 'PEOPLECORE_HRMS',
    legalName: process.env.COMPANY_LEGAL_NAME || 'PeopleCore Enterprise Global Inc.',
  }
};

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'peoplecore-core-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      )
    })
  ]
});

// Singleton Prisma Client instance
export const prisma = new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error']
});
