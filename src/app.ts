import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Routes
import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import productRoutes from './modules/products/routes';
import notificationRoutes from './modules/notifications/routes';
import adminRoutes from './modules/admin/routes';
import chatRoutes from './modules/chat/routes';
import vipRoutes from './modules/vip/routes';
import creditRoutes from './modules/credits/routes';
import analyticsRoutes from './modules/analytics/routes';
import forumsRoutes from './modules/forums/routes';
import paymentRoutes from './modules/payments/routes';

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://localhost:3002'], // Allow Angular and Next.js dev servers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute for testing
  max: 100, // Allow more requests for testing
  message: {
    error: 'Trop de tentatives d\'authentification, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('trust proxy', 1); // Trust first proxy for rate limiting
// Disable rate limiting for development
// app.use(limiter);
// app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FOTOL JAY API',
      version: '1.0.0',
      description: 'API pour l\'application FOTOL JAY',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/*/routes.ts'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API FOTOL JAY',
    version: '1.0.0',
    status: 'OK',
    docs: 'http://localhost:5000/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      notifications: '/api/notifications',
      admin: '/api/admin',
      chat: '/api/chat',
      vip: '/api/vip',
      credits: '/api/credits',
      analytics: '/api/analytics',
      forums: '/api/forums',
      payments: '/api/payments'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur globale:', err.message);
  console.error('Stack:', err.stack);

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Erreur de validation', error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ message: 'Accès interdit' });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({ message: 'Ressource non trouvée' });
  }

  // Default error response
  res.status(500).json({
    message: 'Une erreur inattendue s\'est produite',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur'
  });
});

export default app;