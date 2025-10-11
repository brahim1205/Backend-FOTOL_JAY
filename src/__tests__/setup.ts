import { PrismaClient } from '../prisma';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.product.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.user.deleteMany();
});