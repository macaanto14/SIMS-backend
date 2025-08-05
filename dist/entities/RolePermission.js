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
exports.RolePermission = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("./Role");
const Permission_1 = require("./Permission");
let RolePermission = class RolePermission {
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RolePermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RolePermission.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RolePermission.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], RolePermission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], RolePermission.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Role_1.Role, role => role.rolePermissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", Role_1.Role)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Permission_1.Permission, permission => permission.rolePermissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permissionId' }),
    __metadata("design:type", Permission_1.Permission)
], RolePermission.prototype, "permission", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Entity)('role_permissions'),
    (0, typeorm_1.Unique)(['roleId', 'permissionId']),
    (0, typeorm_1.Index)(['roleId']),
    (0, typeorm_1.Index)(['permissionId'])
], RolePermission);
//# sourceMappingURL=RolePermission.js.map