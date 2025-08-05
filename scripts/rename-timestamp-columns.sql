-- Script to rename all created_at to createdAt and updated_at to updatedAt
-- This script will be run to update the database schema

-- First, let's check what tables have these columns
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
BEGIN
    -- Loop through all tables to find created_at and updated_at columns
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Check for created_at column
        FOR column_record IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'created_at'
        LOOP
            EXECUTE format('ALTER TABLE %I RENAME COLUMN created_at TO "createdAt"', table_record.table_name);
            RAISE NOTICE 'Renamed created_at to createdAt in table %', table_record.table_name;
        END LOOP;
        
        -- Check for updated_at column
        FOR column_record IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'updated_at'
        LOOP
            EXECUTE format('ALTER TABLE %I RENAME COLUMN updated_at TO "updatedAt"', table_record.table_name);
            RAISE NOTICE 'Renamed updated_at to updatedAt in table %', table_record.table_name;
        END LOOP;
    END LOOP;
END $$;

-- Update any indexes that reference the old column names
DO $$
DECLARE
    index_record RECORD;
BEGIN
    -- Find indexes that reference created_at or updated_at
    FOR index_record IN
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND (indexdef LIKE '%created_at%' OR indexdef LIKE '%updated_at%')
    LOOP
        -- Drop and recreate the index with new column names
        EXECUTE format('DROP INDEX IF EXISTS %I', index_record.indexname);
        
        -- Recreate index with updated column names
        DECLARE
            new_indexdef TEXT;
        BEGIN
            new_indexdef := replace(replace(index_record.indexdef, 'created_at', '"createdAt"'), 'updated_at', '"updatedAt"');
            EXECUTE new_indexdef;
            RAISE NOTICE 'Recreated index % with updated column names', index_record.indexname;
        END;
    END LOOP;
END $$;

-- Update any triggers that reference the old column names
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find triggers that might reference updated_at
    FOR trigger_record IN
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
    LOOP
        RAISE NOTICE 'Found trigger % on table % that may need updating', trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
END $$;