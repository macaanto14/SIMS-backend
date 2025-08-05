/**
 * Enhanced Authentication Controller
 * Leverages Node.js non-blocking architecture with parallel operations
 */

const { executeTransaction, executeQuery } = require('../../../utils/database');
const { AuthService } = require('../../../core/services/AuthService');
const { UserService } = require('../../../core/services/UserService');
const { CacheService } = require('../../../core/services/CacheService');
const { asyncHandler } = require('../../../utils/errors');
const { successResponse, errorResponse } = require('../../../utils/response');
const logger = require('../../../utils/logger');

class EnhancedAuthController {
  /**
   * Register user with parallel validation and operations
   */
  static register = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { email, password, first_name, last_name, phone, school_id } = req.body;

    try {
      // Parallel validation operations
      const [existingUser, schoolExists] = await Promise.all([
        UserService.findByEmail(email),
        school_id ? UserService.validateSchoolExists(school_id) : Promise.resolve(true)
      ]);

      if (existingUser) {
        return errorResponse(res, 'User already exists with this email', 409);
      }

      if (school_id && !schoolExists) {
        return errorResponse(res, 'Invalid school ID', 400);
      }

      // Parallel password hashing and user creation preparation
      const [hashedPassword, defaultRole] = await Promise.all([
        AuthService.hashPassword(password),
        UserService.getDefaultRole()
      ]);

      // Transaction for user creation and role assignment
      const queries = [
        {
          query: `INSERT INTO users (email, password_hash, first_name, last_name, phone) 
                  VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          params: [email, hashedPassword, first_name, last_name, phone]
        }
      ];

      if (school_id && defaultRole) {
        queries.push({
          query: `INSERT INTO user_roles (user_id, role_id, school_id) 
                  VALUES ($1, $2, $3)`,
          params: ['{{USER_ID}}', defaultRole.id, school_id] // Will be replaced after user creation
        });
      }

      const results = await executeTransaction(queries, {
        isolationLevel: 'READ COMMITTED'
      });

      const user = results[0].rows[0];

      // Update user ID in role assignment query if needed
      if (queries.length > 1) {
        await executeQuery(
          `INSERT INTO user_roles (user_id, role_id, school_id) VALUES ($1, $2, $3)`,
          [user.id, defaultRole.id, school_id]
        );
      }

      // Parallel token generation and user data preparation
      const [token, userProfile] = await Promise.all([
        AuthService.generateToken({ userId: user.id, email: user.email }),
        UserService.getUserProfile(user.id)
      ]);

      // Async cache operations (non-blocking)
      setImmediate(() => {
        CacheService.setUserSession(user.id, token).catch(err => 
          logger.error('Cache operation failed:', err)
        );
      });

      const duration = Date.now() - startTime;
      logger.performance('User registration completed', { duration, userId: user.id });

      return successResponse(res, {
        user: userProfile,
        token
      }, 'User registered successfully', 201);

    } catch (error) {
      logger.error('Registration error:', error);
      return errorResponse(res, 'Registration failed', 500);
    }
  });

  /**
   * Login with parallel operations and caching
   */
  static login = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { email, password } = req.body;

    try {
      // Check cache first (non-blocking fallback to database)
      const cachedUser = await CacheService.getUserByEmail(email).catch(() => null);
      
      let user;
      if (cachedUser) {
        user = cachedUser;
      } else {
        // Database query with user roles in single query
        const userResult = await executeQuery(`
          SELECT u.*, 
                 array_agg(
                   DISTINCT jsonb_build_object(
                     'roleId', ur.role_id,
                     'roleName', r.name,
                     'schoolId', ur.school_id,
                     'schoolName', s.name
                   )
                 ) FILTER (WHERE ur.role_id IS NOT NULL) as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
          LEFT JOIN roles r ON ur.role_id = r.id
          LEFT JOIN schools s ON ur.school_id = s.id
          WHERE u.email = $1 AND u.is_active = true
          GROUP BY u.id
        `, [email]);

        if (userResult.rows.length === 0) {
          return errorResponse(res, 'Invalid credentials', 401);
        }

        user = userResult.rows[0];
        
        // Cache user data asynchronously
        setImmediate(() => {
          CacheService.setUserByEmail(email, user).catch(err => 
            logger.error('Cache operation failed:', err)
          );
        });
      }

      // Parallel password verification and login tracking
      const [isValidPassword] = await Promise.all([
        AuthService.comparePassword(password, user.password_hash),
        // Update last login asynchronously (non-blocking)
        executeQuery(
          'UPDATE users SET last_login_at = NOW() WHERE id = $1',
          [user.id]
        ).catch(err => logger.error('Login tracking failed:', err))
      ]);

      if (!isValidPassword) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Generate token and prepare response
      const token = await AuthService.generateToken({ 
        userId: user.id, 
        email: user.email 
      });

      // Async session management
      setImmediate(() => {
        CacheService.setUserSession(user.id, token).catch(err => 
          logger.error('Session cache failed:', err)
        );
      });

      const duration = Date.now() - startTime;
      logger.performance('User login completed', { duration, userId: user.id });

      return successResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles || []
        },
        token
      }, 'Login successful');

    } catch (error) {
      logger.error('Login error:', error);
      return errorResponse(res, 'Login failed', 500);
    }
  });

  /**
   * Get profile with caching and parallel data fetching
   */
  static getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const startTime = Date.now();

    try {
      // Try cache first, fallback to database
      let userProfile = await CacheService.getUserProfile(userId).catch(() => null);

      if (!userProfile) {
        // Parallel data fetching
        const [userResult, recentActivity] = await Promise.all([
          executeQuery(`
            SELECT u.*, 
                   array_agg(
                     DISTINCT jsonb_build_object(
                       'roleId', ur.role_id,
                       'roleName', r.name,
                       'schoolId', ur.school_id,
                       'schoolName', s.name
                     )
                   ) FILTER (WHERE ur.role_id IS NOT NULL) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN schools s ON ur.school_id = s.id
            WHERE u.id = $1
            GROUP BY u.id
          `, [userId]),
          
          // Get recent activity asynchronously
          UserService.getRecentActivity(userId).catch(() => [])
        ]);

        if (userResult.rows.length === 0) {
          return errorResponse(res, 'User not found', 404);
        }

        const user = userResult.rows[0];
        userProfile = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
          createdAt: user.createdAt,
          lastLoginAt: user.last_login_at,
          roles: user.roles || [],
          recentActivity
        };

        // Cache the profile asynchronously
        setImmediate(() => {
          CacheService.setUserProfile(userId, userProfile).catch(err => 
            logger.error('Profile cache failed:', err)
          );
        });
      }

      const duration = Date.now() - startTime;
      logger.performance('Profile fetch completed', { duration, userId });

      return successResponse(res, userProfile);

    } catch (error) {
      logger.error('Get profile error:', error);
      return errorResponse(res, 'Failed to get profile', 500);
    }
  });
}

module.exports = EnhancedAuthController;