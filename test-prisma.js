const { PrismaClient } = require('./src/prisma/index.js');

console.log('PrismaClient:', typeof PrismaClient);
const prisma = new PrismaClient();
console.log('Prisma instance:', typeof prisma);
console.log('Prisma user:', typeof prisma.user);