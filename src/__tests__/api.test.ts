import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
};

let authToken: string;
let userId: string;
let productId: string;

describe('FOTOL JAY API Tests', () => {
  beforeAll(async () => {
    // Nettoyer la base de données de test
    await (prisma as any).chatMessage.deleteMany();
    await (prisma as any).notification.deleteMany();
    await (prisma as any).product.deleteMany();
    await (prisma as any).credit.deleteMany();
    await (prisma as any).user.deleteMany();
  });

  afterAll(async () => {
    await (prisma as any).$disconnect();
  });

  describe('Health Check', () => {
    test('GET /health - should return OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/register - should create user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);

      userId = response.body.user.id;
      authToken = response.body.tokens.accessToken;
    });

    test('POST /api/auth/login - should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
    });

    test('GET /api/auth/profile - should get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });
  });

  describe('Users', () => {
    test('GET /api/users/profile - should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    test('PUT /api/users/profile - should update profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+33123456789',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe('Updated');
    });

    test('GET /api/users/:id - should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    test('GET /api/users/stats - should get user stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });
  });

  describe('Products', () => {
    test('POST /api/products - should create product', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Product')
        .field('description', 'This is a test product')
        .field('price', 99.99)
        .field('location', 'Paris')
        .field('category', 'Electronics')
        .attach('images', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.title).toBe('Test Product');

      productId = response.body.product.id;
    });

    test('GET /api/products - should get products list', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    test('GET /api/products/:id - should get product by ID', async () => {
      const response = await request(app).get(`/api/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.id).toBe(productId);
    });

    test('PUT /api/products/:id - should update product', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Product',
          price: 149.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.product.title).toBe('Updated Product');
    });
  });

  describe('Notifications', () => {
    test('GET /api/notifications - should get notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('unreadCount');
    });

    test('GET /api/notifications/unread-count - should get unread count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('unreadCount');
    });
  });

  describe('VIP', () => {
    test('GET /api/vip/plans - should get VIP plans', async () => {
      const response = await request(app).get('/api/vip/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
    });

    test('GET /api/vip/benefits - should get VIP benefits', async () => {
      const response = await request(app).get('/api/vip/benefits');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('benefits');
    });

    test('GET /api/vip/status - should get VIP status', async () => {
      const response = await request(app)
        .get('/api/vip/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Credits', () => {
    test('GET /api/credits/balance - should get credit balance', async () => {
      const response = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
    });

    test('GET /api/credits/packages - should get credit packages', async () => {
      const response = await request(app).get('/api/credits/packages');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('packages');
      expect(Array.isArray(response.body.packages)).toBe(true);
    });

    test('POST /api/credits/purchase - should purchase credits', async () => {
      const response = await request(app)
        .post('/api/credits/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          paymentMethod: 'stripe',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transaction');
    });
  });

  describe('Chat', () => {
    test('POST /api/chat/messages - should send message', async () => {
      // Créer un deuxième utilisateur pour tester
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'password123',
          firstName: 'Test2',
          lastName: 'User2',
        });

      const user2Id = user2Response.body.user.id;

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          toUserId: user2Id,
          productId: productId,
          message: 'Hello, is this product still available?',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('chatMessage');
    });

    test('GET /api/chat/conversations - should get conversations', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
    });
  });

  describe('Admin (requires admin user)', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Créer un utilisateur admin pour les tests
      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
        });

      const adminId = adminResponse.body.user.id;

      // Mettre à jour le rôle en admin (dans un vrai système, cela serait fait via DB)
      await (prisma as any).user.update({
        where: { id: adminId },
        data: { role: 'ADMIN' },
      });

      // Se connecter en tant qu'admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123',
        });

      adminToken = loginResponse.body.tokens.accessToken;
    });

    test('GET /api/admin/stats - should get admin stats', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
    });

    test('GET /api/admin/users - should get users list', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
    });

    test('GET /api/admin/products/pending - should get pending products', async () => {
      const response = await request(app)
        .get('/api/admin/products/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - should return 404', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    test('POST /api/auth/login - invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    test('GET /api/users/profile - without auth', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
    });
  });
});