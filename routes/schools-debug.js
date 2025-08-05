const express = require('express');
const router = express.Router();
const pool = require('../config/database-debug'); // Use fresh debug database connection

// Simple GET endpoint without authentication
router.get('/', async (req, res) => {
  try {
    console.log('📍 Schools GET endpoint hit');
    
    const result = await pool.query(`
      SELECT id, name, code, address, phone, email, website, logo_url, is_active, createdAt
      FROM schools 
      WHERE is_active = true 
      ORDER BY createdAt DESC 
      LIMIT 10
    `);
    
    res.json({
      success: true,
      message: 'Schools retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Schools GET error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve schools',
      error: error.message
    });
  }
});

// Simple POST endpoint without authentication
router.post('/', async (req, res) => {
  try {
    console.log('📍 Schools POST endpoint hit');
    console.log('📦 Request body:', req.body);
    
    const { name, code, address, phone, email, website, logoUrl } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }
    
    // Clean up the website and logoUrl fields (remove backticks and extra spaces)
    const cleanWebsite = website ? website.replace(/`/g, '').trim() : null;
    const cleanLogoUrl = logoUrl ? logoUrl.replace(/`/g, '').trim() : null;
    
    const result = await pool.query(`
      INSERT INTO schools (name, code, address, phone, email, website, logo_url, is_active, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      RETURNING *
    `, [name, code, address, phone, email, cleanWebsite, cleanLogoUrl]);
    
    console.log('✅ School created successfully:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        code: result.rows[0].code,
        address: result.rows[0].address,
        phone: result.rows[0].phone,
        email: result.rows[0].email,
        website: result.rows[0].website,
        logoUrl: result.rows[0].logo_url,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].createdAt,
        updatedAt: result.rows[0].updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Schools POST error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'School code already exists',
        details: error.detail
      });
    }
    
    if (error.code === '23502') {
      return res.status(400).json({
        success: false,
        message: 'Missing required field',
        details: error.detail
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create school',
      error: error.message,
      details: error.detail || 'No additional details'
    });
  }
});

module.exports = router;