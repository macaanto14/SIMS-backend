"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteMigration1700000000001 = void 0;
class CompleteMigration1700000000001 {
    constructor() {
        this.name = 'CompleteMigration1700000000001';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "module" character varying(100) NOT NULL,
        "action" character varying(100) NOT NULL,
        "description" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_module_action" UNIQUE ("module", "action")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "schoolId" uuid,
        "assignedBy" uuid,
        "assignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_roles_user_role_school" UNIQUE ("userId", "roleId", "schoolId")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_permissions_role_permission" UNIQUE ("roleId", "permissionId")
      )
    `);
        await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_logs_operation_type_enum') THEN
          CREATE TYPE "audit_logs_operation_type_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS');
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "operation_type" "audit_logs_operation_type_enum" NOT NULL,
        "table_name" character varying(100) NOT NULL,
        "record_id" uuid,
        "user_email" character varying(255),
        "user_role" character varying(100),
        "ip_address" inet,
        "user_agent" text,
        "module" character varying(100),
        "action" character varying(100),
        "description" text,
        "old_values" jsonb,
        "new_values" jsonb,
        "changed_fields" text[],
        "success" boolean NOT NULL DEFAULT true,
        "error_message" text,
        "duration_ms" integer,
        "request_id" character varying(100),
        "session_id" character varying(100),
        "school_name" character varying(255),
        "fields_changed" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid,
        "school_id" uuid,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "academic_years" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_current" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academic_years" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "classes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "academic_year_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "section" character varying(10),
        "capacity" integer NOT NULL DEFAULT 30,
        "room_number" character varying(20),
        "class_teacher_id" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_classes" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "subjects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "code" character varying(20) NOT NULL,
        "description" text,
        "credits" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subjects" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "student_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "school_id" uuid NOT NULL,
        "class_id" uuid,
        "student_id" character varying(50) NOT NULL,
        "admission_date" date NOT NULL,
        "date_of_birth" date NOT NULL,
        "gender" character varying(10) NOT NULL,
        "blood_group" character varying(5),
        "address" text,
        "guardian_name" character varying(100),
        "guardian_phone" character varying(20),
        "guardian_email" character varying(255),
        "emergency_contact" character varying(20),
        "medical_conditions" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_profiles_student_id" UNIQUE ("student_id"),
        CONSTRAINT "UQ_student_profiles_user_id" UNIQUE ("user_id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "teacher_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "school_id" uuid NOT NULL,
        "employee_id" character varying(50) NOT NULL,
        "hire_date" date NOT NULL,
        "department" character varying(100),
        "specialization" character varying(100),
        "qualification" character varying(255),
        "experience_years" integer NOT NULL DEFAULT 0,
        "salary" decimal(10,2),
        "emergency_contact" character varying(20),
        "address" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teacher_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_teacher_profiles_employee_id" UNIQUE ("employee_id"),
        CONSTRAINT "UQ_teacher_profiles_user_id" UNIQUE ("user_id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "parent_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "school_id" uuid NOT NULL,
        "occupation" character varying(100),
        "workplace" character varying(255),
        "annual_income" decimal(12,2),
        "address" text,
        "emergency_contact" character varying(20),
        "relationship_to_student" character varying(50),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parent_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_parent_profiles_user_id" UNIQUE ("user_id")
      )
    `);
        await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
          CREATE TYPE "attendance_status_enum" AS ENUM('present', 'absent', 'late', 'excused');
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "classId" uuid NOT NULL,
        "date" date NOT NULL,
        "status" "attendance_status_enum" NOT NULL,
        "notes" text,
        "markedBy" uuid NOT NULL,
        "markedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_attendance_student_date" UNIQUE ("studentId", "date")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "grades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "subjectId" uuid NOT NULL,
        "termId" uuid NOT NULL,
        "assessmentType" character varying(50) NOT NULL,
        "maxMarks" integer NOT NULL,
        "obtainedMarks" integer NOT NULL,
        "grade" character varying(5),
        "remarks" text,
        "assessedBy" uuid NOT NULL,
        "assessedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grades" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "terms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "academicYearId" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_terms" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "timetables" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "classId" uuid NOT NULL,
        "subjectId" uuid NOT NULL,
        "teacherId" uuid NOT NULL,
        "dayOfWeek" integer NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "roomNumber" character varying(20),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timetables" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "fee_structures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "schoolId" uuid NOT NULL,
        "academicYearId" uuid NOT NULL,
        "classId" uuid,
        "feeType" character varying(100) NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "frequency" character varying(20) NOT NULL DEFAULT 'monthly',
        "dueDateRule" character varying(100),
        "isMandatory" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_structures" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "student_fees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "feeStructureId" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "dueDate" date NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "paidAmount" decimal(10,2) NOT NULL DEFAULT 0,
        "paidDate" date,
        "lateFee" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "remarks" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_fees" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "fee_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentFeeId" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "paymentMethod" character varying(50) NOT NULL,
        "transactionId" character varying(255),
        "paymentDate" date NOT NULL,
        "receivedBy" uuid NOT NULL,
        "remarks" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_payments" PRIMARY KEY ("id")
      )
    `);
        const foreignKeys = [
            {
                name: 'FK_user_roles_user',
                table: 'user_roles',
                column: 'userId',
                references: 'users(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_user_roles_role',
                table: 'user_roles',
                column: 'roleId',
                references: 'roles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_user_roles_school',
                table: 'user_roles',
                column: 'schoolId',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_user_roles_assigned_by',
                table: 'user_roles',
                column: 'assignedBy',
                references: 'users(id)',
                onDelete: 'SET NULL'
            },
            {
                name: 'FK_role_permissions_role',
                table: 'role_permissions',
                column: 'roleId',
                references: 'roles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_role_permissions_permission',
                table: 'role_permissions',
                column: 'permissionId',
                references: 'permissions(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_audit_logs_user',
                table: 'audit_logs',
                column: 'user_id',
                references: 'users(id)',
                onDelete: 'SET NULL'
            },
            {
                name: 'FK_audit_logs_school',
                table: 'audit_logs',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'SET NULL'
            },
            {
                name: 'FK_academic_years_school',
                table: 'academic_years',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_classes_school',
                table: 'classes',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_classes_academic_year',
                table: 'classes',
                column: 'academic_year_id',
                references: 'academic_years(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_classes_teacher',
                table: 'classes',
                column: 'class_teacher_id',
                references: 'teacher_profiles(id)',
                onDelete: 'SET NULL'
            },
            {
                name: 'FK_subjects_school',
                table: 'subjects',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_student_profiles_user',
                table: 'student_profiles',
                column: 'user_id',
                references: 'users(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_student_profiles_school',
                table: 'student_profiles',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_student_profiles_class',
                table: 'student_profiles',
                column: 'class_id',
                references: 'classes(id)',
                onDelete: 'SET NULL'
            },
            {
                name: 'FK_teacher_profiles_user',
                table: 'teacher_profiles',
                column: 'user_id',
                references: 'users(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_teacher_profiles_school',
                table: 'teacher_profiles',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_parent_profiles_user',
                table: 'parent_profiles',
                column: 'user_id',
                references: 'users(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_parent_profiles_school',
                table: 'parent_profiles',
                column: 'school_id',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_attendance_student',
                table: 'attendance',
                column: 'studentId',
                references: 'student_profiles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_attendance_class',
                table: 'attendance',
                column: 'classId',
                references: 'classes(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_attendance_marked_by',
                table: 'attendance',
                column: 'markedBy',
                references: 'users(id)',
                onDelete: 'RESTRICT'
            },
            {
                name: 'FK_grades_student',
                table: 'grades',
                column: 'studentId',
                references: 'student_profiles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_grades_subject',
                table: 'grades',
                column: 'subjectId',
                references: 'subjects(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_grades_term',
                table: 'grades',
                column: 'termId',
                references: 'terms(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_grades_assessed_by',
                table: 'grades',
                column: 'assessedBy',
                references: 'users(id)',
                onDelete: 'RESTRICT'
            },
            {
                name: 'FK_terms_academic_year',
                table: 'terms',
                column: 'academicYearId',
                references: 'academic_years(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_timetables_class',
                table: 'timetables',
                column: 'classId',
                references: 'classes(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_timetables_subject',
                table: 'timetables',
                column: 'subjectId',
                references: 'subjects(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_timetables_teacher',
                table: 'timetables',
                column: 'teacherId',
                references: 'teacher_profiles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_fee_structures_school',
                table: 'fee_structures',
                column: 'schoolId',
                references: 'schools(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_fee_structures_academic_year',
                table: 'fee_structures',
                column: 'academicYearId',
                references: 'academic_years(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_fee_structures_class',
                table: 'fee_structures',
                column: 'classId',
                references: 'classes(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_student_fees_student',
                table: 'student_fees',
                column: 'studentId',
                references: 'student_profiles(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_student_fees_fee_structure',
                table: 'student_fees',
                column: 'feeStructureId',
                references: 'fee_structures(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_fee_payments_student_fee',
                table: 'fee_payments',
                column: 'studentFeeId',
                references: 'student_fees(id)',
                onDelete: 'CASCADE'
            },
            {
                name: 'FK_fee_payments_received_by',
                table: 'fee_payments',
                column: 'receivedBy',
                references: 'users(id)',
                onDelete: 'RESTRICT'
            }
        ];
        for (const fk of foreignKeys) {
            await queryRunner.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${fk.name}') THEN
            ALTER TABLE "${fk.table}" 
            ADD CONSTRAINT "${fk.name}" 
            FOREIGN KEY ("${fk.column}") REFERENCES ${fk.references} ON DELETE ${fk.onDelete};
          END IF;
        END $$;
      `);
        }
        const indexes = [
            { name: 'IDX_user_roles_userId', table: 'user_roles', column: 'userId' },
            { name: 'IDX_user_roles_roleId', table: 'user_roles', column: 'roleId' },
            { name: 'IDX_user_roles_schoolId', table: 'user_roles', column: 'schoolId' },
            { name: 'IDX_user_roles_isActive', table: 'user_roles', column: 'isActive' },
            { name: 'IDX_audit_logs_operation_type', table: 'audit_logs', column: 'operation_type' },
            { name: 'IDX_audit_logs_table_name', table: 'audit_logs', column: 'table_name' },
            { name: 'IDX_audit_logs_user_id', table: 'audit_logs', column: 'user_id' },
            { name: 'IDX_audit_logs_school_id', table: 'audit_logs', column: 'school_id' },
            { name: 'IDX_audit_logs_created_at', table: 'audit_logs', column: 'createdAt' },
            { name: 'IDX_academic_years_school_id', table: 'academic_years', column: 'school_id' },
            { name: 'IDX_academic_years_is_current', table: 'academic_years', column: 'is_current' },
            { name: 'IDX_classes_school_id', table: 'classes', column: 'school_id' },
            { name: 'IDX_classes_academic_year_id', table: 'classes', column: 'academic_year_id' },
            { name: 'IDX_classes_isActive', table: 'classes', column: 'isActive' },
            { name: 'IDX_subjects_school_id', table: 'subjects', column: 'school_id' },
            { name: 'IDX_subjects_isActive', table: 'subjects', column: 'isActive' },
            { name: 'IDX_student_profiles_school_id', table: 'student_profiles', column: 'school_id' },
            { name: 'IDX_student_profiles_class_id', table: 'student_profiles', column: 'class_id' },
            { name: 'IDX_student_profiles_isActive', table: 'student_profiles', column: 'isActive' },
            { name: 'IDX_teacher_profiles_school_id', table: 'teacher_profiles', column: 'school_id' },
            { name: 'IDX_teacher_profiles_isActive', table: 'teacher_profiles', column: 'isActive' },
            { name: 'IDX_parent_profiles_school_id', table: 'parent_profiles', column: 'school_id' },
            { name: 'IDX_parent_profiles_user_id', table: 'parent_profiles', column: 'user_id' },
            { name: 'IDX_attendance_studentId', table: 'attendance', column: 'studentId' },
            { name: 'IDX_attendance_classId', table: 'attendance', column: 'classId' },
            { name: 'IDX_attendance_date', table: 'attendance', column: 'date' },
            { name: 'IDX_grades_studentId', table: 'grades', column: 'studentId' },
            { name: 'IDX_grades_subjectId', table: 'grades', column: 'subjectId' },
            { name: 'IDX_grades_termId', table: 'grades', column: 'termId' },
            { name: 'IDX_timetables_classId', table: 'timetables', column: 'classId' },
            { name: 'IDX_timetables_teacherId', table: 'timetables', column: 'teacherId' },
            { name: 'IDX_timetables_dayOfWeek', table: 'timetables', column: 'dayOfWeek' }
        ];
        for (const idx of indexes) {
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${idx.name}" ON "${idx.table}" ("${idx.column}")`);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "fee_payments"`);
        await queryRunner.query(`DROP TABLE "student_fees"`);
        await queryRunner.query(`DROP TABLE "fee_structures"`);
        await queryRunner.query(`DROP TABLE "timetables"`);
        await queryRunner.query(`DROP TABLE "terms"`);
        await queryRunner.query(`DROP TABLE "grades"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "parent_profiles"`);
        await queryRunner.query(`DROP TABLE "teacher_profiles"`);
        await queryRunner.query(`DROP TABLE "student_profiles"`);
        await queryRunner.query(`DROP TABLE "subjects"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP TABLE "academic_years"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TYPE "attendance_status_enum"`);
        await queryRunner.query(`DROP TYPE "audit_logs_operation_type_enum"`);
    }
}
exports.CompleteMigration1700000000001 = CompleteMigration1700000000001;
//# sourceMappingURL=1700000000001-CompleteMigration.js.map