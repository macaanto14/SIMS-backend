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
exports.ParentProfile = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const User_1 = require("./User");
const School_1 = require("./School");
let ParentProfile = class ParentProfile extends BaseEntity_1.BaseEntity {
    get displayName() {
        return `${this.relationship} - ${this.user?.fullName || 'Unknown'}`;
    }
};
exports.ParentProfile = ParentProfile;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ParentProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ParentProfile.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ParentProfile.prototype, "relationship", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "occupation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ParentProfile.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.parentProfile),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], ParentProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.parentProfiles),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], ParentProfile.prototype, "school", void 0);
exports.ParentProfile = ParentProfile = __decorate([
    (0, typeorm_1.Entity)('parent_profiles'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['schoolId'])
], ParentProfile);
//# sourceMappingURL=ParentProfile.js.map