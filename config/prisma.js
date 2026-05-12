const { PrismaClient } = require('@prisma/client');

// Sử dụng Prisma 6 Native Engine (Library) - Ổn định nhất
const prisma = new PrismaClient();

module.exports = prisma;
