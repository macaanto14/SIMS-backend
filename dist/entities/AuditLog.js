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
exports.AuditLog = exports.OperationType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const School_1 = require("./School");
const uuid_1 = require("uuid");
var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "CREATE";
    OperationType["UPDATE"] = "UPDATE";
    OperationType["DELETE"] = "DELETE";
    OperationType["LOGIN"] = "LOGIN";
    OperationType["LOGOUT"] = "LOGOUT";
    OperationType["ACCESS"] = "ACCESS";
})(OperationType || (exports.OperationType = OperationType = {}));
let AuditLog = class AuditLog {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'operation_type',
        type: 'enum',
        enum: OperationType,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "operationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'table_name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AuditLog.prototype, "tableName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'record_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "recordId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_role', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'inet', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_values', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "oldValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_values', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "newValues", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changed_fields', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "changedFields", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_ms', type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "durationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "schoolName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fields_changed', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AuditLog.prototype, "fieldsChanged", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.auditLogs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuditLog.prototype, "generateId", null);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['operationType']),
    (0, typeorm_1.Index)(['tableName']),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['createdAt'])
], AuditLog);
//# sourceMappingURL=AuditLog.js.map