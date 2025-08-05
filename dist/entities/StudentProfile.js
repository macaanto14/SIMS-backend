"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfile = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const User_1 = require("./User");
const School_1 = require("./School");
const Class_1 = require("./Class");
const Attendance_1 = require("./Attendance");
const Grade_1 = require("./Grade");
const StudentFee_1 = require("./StudentFee");
let StudentProfile = class StudentProfile extends BaseEntity_1.BaseEntity {
    get fullName() {
        return `${this.user.firstName} ${this.user.lastName}`;
    }
    get age() {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'school_id' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'class_id' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'student_id' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'admission_date' }),
    __metadata("design:type", Date)
], StudentProfile.prototype, "admissionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'date_of_birth' }),
    __metadata("design:type", Date)
], StudentProfile.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], StudentProfile.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 5, nullable: true, name: 'blood_group' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "bloodGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'guardian_name' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "guardianName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, name: 'guardian_phone' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "guardianPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'guardian_email' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "guardianEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'medical_conditions' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "medicalConditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], StudentProfile.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.studentProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], StudentProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.students, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], StudentProfile.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Class_1.Class, classEntity => classEntity.students, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Attendance_1.Attendance, attendance => attendance.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "attendanceRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Grade_1.Grade, grade => grade.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "grades", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StudentFee_1.StudentFee, fee => fee.student),
    __metadata("design:type", Array)
], StudentProfile.prototype, "fees", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, typeorm_1.Entity)('student_profiles'),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['classId']),
    (0, typeorm_1.Index)(['isActive'])
], StudentProfile);
//# sourceMappingURL=StudentProfile.js.map