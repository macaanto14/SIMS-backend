"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)();
const createCacheConfig = () => {
    if (process.env.REDIS_URL && process.env.NODE_ENV !== 'development') {
        return {
            type: 'redis',
            options: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
            duration: 30000,
        };
    }
    return {
        type: 'database',
        duration: 30000,
    };
};
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [path_1.default.join(__dirname, '../entities/**/*.{ts,js}')],
    migrations: [path_1.default.join(__dirname, '../migrations/**/*.{ts,js}')],
    subscribers: [path_1.default.join(__dirname, '../subscribers/**/*.{ts,js}')],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    extra: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    },
    migrationsRun: false,
    migrationsTableName: 'typeorm_migrations',
    cache: createCacheConfig(),
});
const initializeDatabase = async () => {
    try {
        console.log('🔄 Initializing TypeORM database connection...');
        await exports.AppDataSource.initialize();
        console.log('✅ TypeORM database connection established successfully');
        console.log('ℹ️  Schema synchronization is disabled to prevent conflicts with existing data');
    }
    catch (error) {
        console.error('❌ Error during database initialization:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const closeDatabase = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            console.log('✅ Database connection closed successfully');
        }
    }
    catch (error) {
        console.error('❌ Error during database shutdown:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map