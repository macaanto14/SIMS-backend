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
exports.TeacherProfile = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const User_1 = require("./User");
const School_1 = require("./School");
const Attendance_1 = require("./Attendance");
const Grade_1 = require("./Grade");
const Timetable_1 = require("./Timetable");
let TeacherProfile = class TeacherProfile extends BaseEntity_1.BaseEntity {
    get fullName() {
        return `${this.user.firstName} ${this.user.lastName}`;
    }
    get displayName() {
        return `${this.fullName} (${this.employeeId})`;
    }
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'school_id' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'employee_id' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'hire_date' }),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "hireDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "specialization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "qualification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'experience_years' }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "experienceYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "salary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact' }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TeacherProfile.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.teacherProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], TeacherProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.teachers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], TeacherProfile.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Attendance_1.Attendance, attendance => attendance.markedByUser),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "markedAttendance", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Grade_1.Grade, grade => grade.assessedByUser),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "assessedGrades", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Timetable_1.Timetable, timetable => timetable.teacher),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "timetables", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('teacher_profiles'),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['isActive'])
], TeacherProfile);
//# sourceMappingURL=TeacherProfile.js.map