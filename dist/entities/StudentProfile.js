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
let StudentProfile = class StudentProfile extends BaseEntity_1.BaseEntity {
    get age() {
        if (!this.dateOfBirth)
            return null;
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    get displayName() {
        return this.user?.fullName || 'Unknown Student';
    }
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], StudentProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "rollNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], StudentProfile.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "bloodGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StudentProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], StudentProfile.prototype, "admissionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.studentProfile),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], StudentProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.studentProfiles),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], StudentProfile.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Class_1.Class, classEntity => classEntity.students, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", Class_1.Class)
], StudentProfile.prototype, "class", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, typeorm_1.Entity)('student_profiles'),
    (0, typeorm_1.Index)(['userId'], { unique: true }),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['classId']),
    (0, typeorm_1.Index)(['isActive'])
], StudentProfile);
//# sourceMappingURL=StudentProfile.js.map