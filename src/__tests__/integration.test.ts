import request from 'supertest';
import app from '../app';
import prisma from '../prisma';

describe('FOTOL JAY Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let productId: string;

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

  describe('User Registration and Authentication', () => {
    test('POST /api/auth/register - should create user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration@test.com',
          password: 'password123',
          firstName: 'Integration',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe('integration@test.com');

      userId = response.body.user.id;
      authToken = response.body.tokens.accessToken;
    });

    test('POST /api/auth/login - should authenticate user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
    });
  });

  describe('Product Management', () => {
    test('POST /api/products - should create product with image upload', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Integration Test Product')
        .field('description', 'This is a test product for integration testing')
        .field('price', 150.00)
        .field('location', 'Dakar')
        .field('category', 'Electronics')
        .attach('images', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.title).toBe('Integration Test Product');

      productId = response.body.product.id;
    });

    test('GET /api/products - should retrieve products list', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    test('GET /api/products/:id - should retrieve specific product', async () => {
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
          title: 'Updated Integration Test Product',
          price: 200.00,
        });

      expect(response.status).toBe(200);
      expect(response.body.product.title).toBe('Updated Integration Test Product');
      expect(response.body.product.price).toBe(200.00);
    });
  });

  describe('Credit System', () => {
    test('GET /api/credits/balance - should get user credit balance', async () => {
      const response = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.balance).toBe('number');
    });

    test('GET /api/credits/packages - should get credit packages', async () => {
      const response = await request(app).get('/api/credits/packages');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('packages');
      expect(Array.isArray(response.body.packages)).toBe(true);
    });
  });

  describe('VIP System', () => {
    test('GET /api/vip/plans - should get VIP plans', async () => {
      const response = await request(app).get('/api/vip/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
    });

    test('GET /api/vip/status - should get VIP status', async () => {
      const response = await request(app)
        .get('/api/vip/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Notification System', () => {
    test('GET /api/notifications - should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('unreadCount');
    });
  });

  describe('Admin Features', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Créer un utilisateur admin pour les tests
      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@integration.test',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'Integration',
        });

      const adminId = adminResponse.body.user.id;

      // Mettre à jour le rôle en admin
      await (prisma as any).user.update({
        where: { id: adminId },
        data: { role: 'ADMIN' },
      });

      // Se connecter en tant qu'admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@integration.test',
          password: 'admin123',
        });

      adminToken = loginResponse.body.tokens.accessToken;
    });

    test('GET /api/admin/stats - should get admin statistics', async () => {
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
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('GET /api/admin/products/pending - should get pending products', async () => {
      const response = await request(app)
        .get('/api/admin/products/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });
  });

  describe('Health Check', () => {
    test('GET /health - should return system health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('version');
    });

    test('GET / - should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('docs');
      expect(response.body).toHaveProperty('endpoints');
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
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    test('GET /api/users/profile - without auth', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
    });

    test('PUT /api/products/nonexistent - should return 404', async () => {
      const response = await request(app)
        .put('/api/products/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' });

      expect(response.status).toBe(404);
    });
  });
});