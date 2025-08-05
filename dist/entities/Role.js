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
exports.Role = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const UserRole_1 = require("./UserRole");
const RolePermission_1 = require("./RolePermission");
let Role = class Role extends BaseEntity_1.BaseEntity {
    get displayName() {
        return this.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Role.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Role.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Role.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Role.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserRole_1.UserRole, userRole => userRole.role),
    __metadata("design:type", Array)
], Role.prototype, "userRoles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RolePermission_1.RolePermission, rolePermission => rolePermission.role),
    __metadata("design:type", Array)
], Role.prototype, "rolePermissions", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('roles'),
    (0, typeorm_1.Index)(['name'], { unique: true }),
    (0, typeorm_1.Index)(['isActive'])
], Role);
//# sourceMappingURL=Role.js.map