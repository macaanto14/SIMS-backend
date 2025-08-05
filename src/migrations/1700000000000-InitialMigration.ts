import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "level" character varying(50),
        "priority" integer NOT NULL DEFAULT 0,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    // Create schools table
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        "address" text,
        "phone" character varying(20),
        "email" character varying(255),
        "website" character varying(255),
        "logoUrl" text,
        "description" text,
        "establishedYear" character varying(100),
        "principalName" character varying(100),
        "principalId" uuid,
        "settings" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_schools" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_schools_code" UNIQUE ("code")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "phone" character varying(20),
        "avatar" text,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "emailVerifiedAt" TIMESTAMP WITH TIME ZONE,
        "resetPasswordToken" character varying(255),
        "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "lastLoginIp" inet,
        "preferences" jsonb,
        "metadata" jsonb,
        "schoolId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "schools" 
      ADD CONSTRAINT "FK_schools_principal" 
      FOREIGN KEY ("principalId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_school" 
      FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_isActive" ON "users" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_schoolId" ON "users" ("schoolId")`);
    await queryRunner.query(`CREATE INDEX "IDX_schools_code" ON "schools" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_schools_isActive" ON "schools" ("isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_roles_name" ON "roles" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_roles_isActive" ON "roles" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "schools"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}