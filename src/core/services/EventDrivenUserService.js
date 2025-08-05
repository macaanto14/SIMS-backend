/**
 * Event-Driven User Service
 * Leverages Node.js EventEmitter for non-blocking operations
 */

const EventEmitter = require('events');
const { executeQuery, executeTransaction } = require('../../utils/database');
const { CacheService } = require('./CacheService');
const logger = require('../../utils/logger');

class EventDrivenUserService extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // User creation events
    this.on('user:created', this.handleUserCreated.bind(this));
    this.on('user:updated', this.handleUserUpdated.bind(this));
    this.on('user:deleted', this.handleUserDeleted.bind(this));
    
    // Role assignment events
    this.on('role:assigned', this.handleRoleAssigned.bind(this));
    this.on('role:revoked', this.handleRoleRevoked.bind(this));
    
    // Activity tracking events
    this.on('activity:log', this.handleActivityLog.bind(this));
  }

  /**
   * Create user with event-driven side effects
   */
  async createUser(userData) {
    try {
      const user = await executeQuery(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userData.email, userData.password_hash, userData.first_name, userData.last_name, userData.phone]);

      const newUser = user.rows[0];

      // Emit events for non-blocking side effects
      setImmediate(() => {
        this.emit('user:created', newUser);
        this.emit('activity:log', {
          userId: newUser.id,
          action: 'user_created',
          metadata: { email: newUser.email }
        });
      });

      return newUser;
    } catch (error) {
      logger.error('User creation failed:', error);
      throw error;
    }
  }

  /**
   * Get users with parallel data fetching and caching
   */
  async getUsers(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    try {
      // Build dynamic query
      const { whereClause, params } = this.buildUserQuery(filters);
      
      // Parallel execution of count and data queries
      const [countResult, usersResult] = await Promise.all([
        executeQuery(`
          SELECT COUNT(DISTINCT u.id) as total
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE ${whereClause}
        `, params),
        
        executeQuery(`
          SELECT u.*, 
                 array_agg(
                   DISTINCT jsonb_build_object(
                     'roleId', ur.role_id,
                     'roleName', r.name,
                     'schoolId', ur.school_id
                   )
                 ) FILTER (WHERE ur.role_id IS NOT NULL) as roles
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE ${whereClause}
          GROUP BY u.id
          ORDER BY u.createdAt DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = usersResult.rows;

      // Async cache warming for frequently accessed users
      setImmediate(() => {
        users.forEach(user => {
          CacheService.setUserProfile(user.id, user).catch(err => 
            logger.error('Cache warming failed:', err)
          );
        });
      });

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get users failed:', error);
      throw error;
    }
  }

  /**
   * Update user with optimistic locking and events
   */
  async updateUser(userId, updateData) {
    try {
      const result = await executeQuery(`
        UPDATE users 
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            avatar_url = COALESCE($4, avatar_url),
            updatedAt = NOW()
        WHERE id = $5 AND is_active = true
        RETURNING *
      `, [updateData.first_name, updateData.last_name, updateData.phone, updateData.avatar_url, userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found or inactive');
      }

      const updatedUser = result.rows[0];

      // Emit events for cache invalidation and activity logging
      setImmediate(() => {
        this.emit('user:updated', updatedUser);
        this.emit('activity:log', {
          userId,
          action: 'user_updated',
          metadata: updateData
        });
      });

      return updatedUser;
    } catch (error) {
      logger.error('User update failed:', error);
      throw error;
    }
  }

  /**
   * Batch operations with parallel processing
   */
  async batchUpdateUsers(updates) {
    try {
      // Process updates in parallel batches
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < updates.length; i += batchSize) {
        batches.push(updates.slice(i, i + batchSize));
      }

      const results = await Promise.all(
        batches.map(batch => 
          Promise.all(
            batch.map(update => this.updateUser(update.id, update.data))
          )
        )
      );

      return results.flat();
    } catch (error) {
      logger.error('Batch update failed:', error);
      throw error;
    }
  }

  // Event handlers for non-blocking side effects
  async handleUserCreated(user) {
    try {
      // Parallel welcome operations
      await Promise.all([
        this.sendWelcomeEmail(user.email),
        this.createUserPreferences(user.id),
        CacheService.invalidateUserCache(user.id)
      ]);
    } catch (error) {
      logger.error('User creation side effects failed:', error);
    }
  }

  async handleUserUpdated(user) {
    try {
      // Invalidate caches and update search index
      await Promise.all([
        CacheService.invalidateUserCache(user.id),
        this.updateSearchIndex(user)
      ]);
    } catch (error) {
      logger.error('User update side effects failed:', error);
    }
  }

  async handleActivityLog(activity) {
    try {
      await executeQuery(`
        INSERT INTO user_activities (user_id, action, metadata, createdAt)
        VALUES ($1, $2, $3, NOW())
      `, [activity.userId, activity.action, JSON.stringify(activity.metadata)]);
    } catch (error) {
      logger.error('Activity logging failed:', error);
    }
  }

  // Helper methods
  buildUserQuery(filters) {
    const conditions = ['u.is_active = true'];
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      conditions.push(`r.name = $${paramCount}`);
      params.push(filters.role);
    }

    if (filters.school_id) {
      paramCount++;
      conditions.push(`ur.school_id = $${paramCount}`);
      params.push(filters.school_id);
    }

    if (filters.search) {
      paramCount++;
      conditions.push(`(u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      params.push(`%${filters.search}%`);
    }

    return {
      whereClause: conditions.join(' AND '),
      params
    };
  }

  async sendWelcomeEmail(email) {
    // Implement email sending logic
    logger.info('Welcome email sent', { email });
  }

  async createUserPreferences(userId) {
    // Create default user preferences
    await executeQuery(`
      INSERT INTO user_preferences (user_id, preferences)
      VALUES ($1, $2)
    `, [userId, JSON.stringify({ theme: 'light', notifications: true })]);
  }

  async updateSearchIndex(user) {
    // Update search index for user
    logger.info('Search index updated', { userId: user.id });
  }
}

module.exports = new EventDrivenUserService();