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
exports.Permission = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const RolePermission_1 = require("./RolePermission");
let Permission = class Permission extends BaseEntity_1.BaseEntity {
    get displayName() {
        return `${this.module}.${this.action}`;
    }
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Permission.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Permission.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Permission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Permission.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RolePermission_1.RolePermission, rolePermission => rolePermission.permission),
    __metadata("design:type", Array)
], Permission.prototype, "rolePermissions", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('permissions'),
    (0, typeorm_1.Unique)(['module', 'action']),
    (0, typeorm_1.Index)(['module']),
    (0, typeorm_1.Index)(['isActive'])
], Permission);
//# sourceMappingURL=Permission.js.map