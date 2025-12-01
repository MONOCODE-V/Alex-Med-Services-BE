import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export { getPrisma };

