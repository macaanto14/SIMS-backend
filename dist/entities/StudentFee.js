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
exports.StudentFee = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const StudentProfile_1 = require("./StudentProfile");
const FeeStructure_1 = require("./FeeStructure");
const FeePayment_1 = require("./FeePayment");
let StudentFee = class StudentFee extends BaseEntity_1.BaseEntity {
    get isPaid() {
        return this.status === 'paid';
    }
    get isOverdue() {
        return this.status === 'overdue' || (this.status === 'unpaid' && new Date() > this.dueDate);
    }
    get totalPaid() {
        return this.payments?.reduce((sum, payment) => sum + payment.amountPaid, 0) || 0;
    }
    get remainingAmount() {
        return Math.max(0, this.amount - this.totalPaid);
    }
};
exports.StudentFee = StudentFee;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'student_id' }),
    __metadata("design:type", String)
], StudentFee.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'fee_structure_id' }),
    __metadata("design:type", String)
], StudentFee.prototype, "feeStructureId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], StudentFee.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'due_date' }),
    __metadata("design:type", Date)
], StudentFee.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'unpaid' }),
    __metadata("design:type", String)
], StudentFee.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudentProfile_1.StudentProfile, student => student.fees),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", StudentProfile_1.StudentProfile)
], StudentFee.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FeeStructure_1.FeeStructure, feeStructure => feeStructure.studentFees),
    (0, typeorm_1.JoinColumn)({ name: 'fee_structure_id' }),
    __metadata("design:type", FeeStructure_1.FeeStructure)
], StudentFee.prototype, "feeStructure", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FeePayment_1.FeePayment, payment => payment.studentFee),
    __metadata("design:type", Array)
], StudentFee.prototype, "payments", void 0);
exports.StudentFee = StudentFee = __decorate([
    (0, typeorm_1.Entity)('student_fees'),
    (0, typeorm_1.Index)(['studentId']),
    (0, typeorm_1.Index)(['feeStructureId']),
    (0, typeorm_1.Index)(['status'])
], StudentFee);
//# sourceMappingURL=StudentFee.js.map