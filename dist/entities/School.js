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
exports.School = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const User_1 = require("./User");
const Class_1 = require("./Class");
const AcademicYear_1 = require("./AcademicYear");
const TeacherProfile_1 = require("./TeacherProfile");
const StudentProfile_1 = require("./StudentProfile");
const ParentProfile_1 = require("./ParentProfile");
let School = class School extends BaseEntity_1.BaseEntity {
    get isSubscriptionActive() {
        if (!this.subscriptionExpiresAt)
            return false;
        return new Date() < this.subscriptionExpiresAt;
    }
    get displayName() {
        return this.name;
    }
};
exports.School = School;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], School.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'active' }),
    __metadata("design:type", String)
], School.prototype, "subscriptionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "subscriptionExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], School.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, user => user.school),
    __metadata("design:type", Array)
], School.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Class_1.Class, classEntity => classEntity.school),
    __metadata("design:type", Array)
], School.prototype, "classes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AcademicYear_1.AcademicYear, academicYear => academicYear.school),
    __metadata("design:type", Array)
], School.prototype, "academicYears", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeacherProfile_1.TeacherProfile, profile => profile.school),
    __metadata("design:type", Array)
], School.prototype, "teacherProfiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StudentProfile_1.StudentProfile, profile => profile.school),
    __metadata("design:type", Array)
], School.prototype, "studentProfiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ParentProfile_1.ParentProfile, profile => profile.school),
    __metadata("design:type", Array)
], School.prototype, "parentProfiles", void 0);
exports.School = School = __decorate([
    (0, typeorm_1.Entity)('schools'),
    (0, typeorm_1.Index)(['isActive']),
    (0, typeorm_1.Index)(['subscriptionStatus'])
], School);
//# sourceMappingURL=School.js.map