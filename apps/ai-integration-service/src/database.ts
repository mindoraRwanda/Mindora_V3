import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/index.js';

// Uses the pg JavaScript driver instead of the native Rust binary — required for
// Docker-on-Windows environments where the native binary cannot route through
// Docker Desktop's port-forwarding layer.
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.AI_DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing required environment variable: AI_DATABASE_URL');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter } as ConstructorParameters<
    typeof PrismaClient
  >[0]);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✓ Database connected (mindora_ai)');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

export { PrismaClient };
