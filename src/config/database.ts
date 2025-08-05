import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config();

// Create cache configuration conditionally
const createCacheConfig = () => {
  // Only use Redis cache if REDIS_URL is provided and not in development mode
  if (process.env.REDIS_URL && process.env.NODE_ENV !== 'development') {
    return {
      type: 'redis' as const,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      duration: 30000, // 30 seconds
    };
  }
  
  // Use in-memory cache for development or when Redis is not available
  return {
    type: 'database' as const,
    duration: 30000, // 30 seconds
  };
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Entity configuration
  entities: [path.join(__dirname, '../entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')],
  
  // Remove the snake case naming strategy since database uses camelCase
  // namingStrategy: new SnakeCaseNamingStrategy(), // REMOVED
  
  // Development settings - temporarily disable synchronize to prevent schema conflicts
  synchronize: false, // Disabled to prevent NOT NULL constraint errors
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  
  // Connection pool settings
  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  
  // Migration settings
  migrationsRun: false, // Disabled for now to prevent conflicts
  migrationsTableName: 'typeorm_migrations',
  
  // Conditional cache settings
  cache: createCacheConfig(),
});

// Database connection helper
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initializing TypeORM database connection...');
    await AppDataSource.initialize();
    console.log('✅ TypeORM database connection established successfully');
    
    // Note: Synchronization and migrations are disabled to prevent schema conflicts
    console.log('ℹ️  Schema synchronization is disabled to prevent conflicts with existing data');
    
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed successfully');
    }
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    throw error;
  }
};