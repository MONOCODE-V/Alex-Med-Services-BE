require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

let prisma;

function getPrisma() {
  if (!prisma) {
    const libsql = createClient({
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    });
    
    const adapter = new PrismaLibSQL(libsql);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

module.exports = { getPrisma };
