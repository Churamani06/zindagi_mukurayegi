const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, initializeTables, createDefaultAdmin } = require('./config/database');
const authRoutes = require('./routes/auth');
const recordsRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 8001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased limit for testing
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration - Support both development and production
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000', 
  'http://10.10.104.65:3000',
  'http://165.22.208.62:3002', // Production frontend URL
  'https://165.22.208.62:3002', // HTTPS version if available
  process.env.FRONTEND_URL // Environment variable
].filter(Boolean); // Remove null/undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Enable credentials for authentication
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false
};
app.use(cors(corsOptions));

// Additional CORS headers for production compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/child-health-records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Mount childController at /api/child
const childController = require('./controllers/childController');
app.use('/api/child', childController);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Child Health Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Child Health Management System API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': {
          description: 'Register a new user',
          body: { username: 'string', password: 'string', role: 'user|admin' }
        },
        'POST /api/auth/login': {
          description: 'Login user',
          body: { username: 'string', password: 'string' }
        },
        'GET /api/auth/profile': {
          description: 'Get user profile',
          headers: { Authorization: 'Bearer <token>' }
        }
      },
      records: {
        'POST /api/child-data': {
          description: 'Submit child health data (User only)',
          headers: { Authorization: 'Bearer <token>' },
          body: {
            child_name: 'string',
            age: 'number',
            gender: 'Male|Female|Other',
            weight: 'number',
            symptoms: 'string (optional)',
            school_name: 'string',
            anganwadi_kendra: 'string',
            health_status: 'Pending|Checked|Referred|Treated|Follow-up Required'
          }
        },
        'GET /api/records': {
          description: 'Get all child health records (Admin only)',
          headers: { Authorization: 'Bearer <token>' },
          query: {
            anganwadi_kendra: 'string (optional)',
            health_status: 'string (optional)',
            start_date: 'YYYY-MM-DD (optional)',
            end_date: 'YYYY-MM-DD (optional)',
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 50)'
          }
        },
        'GET /api/my-records': {
          description: 'Get user\'s own submitted records (User only)',
          headers: { Authorization: 'Bearer <token>' },
          query: {
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 20)'
          }
        },
        'GET /api/dashboard-stats': {
          description: 'Get dashboard statistics (Admin only)',
          headers: { Authorization: 'Bearer <token>' }
        }
      }
    },
    demo_credentials: {
      admin: { username: 'admin', password: 'admin123' },
      user: { username: 'anganwadi_worker', password: 'worker123' }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize tables
    await initializeTables();
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
