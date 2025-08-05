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
let TeacherProfile = class TeacherProfile extends BaseEntity_1.BaseEntity {
    get displayName() {
        return this.user?.fullName || 'Unknown Teacher';
    }
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "qualification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "salary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "joinDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.teacherProfile),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], TeacherProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.teacherProfiles),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], TeacherProfile.prototype, "school", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('teacher_profiles'),
    (0, typeorm_1.Index)(['userId'], { unique: true }),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['isActive'])
], TeacherProfile);
//# sourceMappingURL=TeacherProfile.js.map