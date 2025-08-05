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
exports.FeePayment = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const StudentFee_1 = require("./StudentFee");
const User_1 = require("./User");
let FeePayment = class FeePayment extends BaseEntity_1.BaseEntity {
    get displayAmount() {
        return `${this.amountPaid.toFixed(2)}`;
    }
};
exports.FeePayment = FeePayment;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'student_fee_id' }),
    __metadata("design:type", String)
], FeePayment.prototype, "studentFeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', name: 'amount_paid' }),
    __metadata("design:type", Number)
], FeePayment.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'payment_method' }),
    __metadata("design:type", String)
], FeePayment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'transaction_reference' }),
    __metadata("design:type", Object)
], FeePayment.prototype, "transactionReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'payment_date' }),
    __metadata("design:type", Date)
], FeePayment.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'received_by' }),
    __metadata("design:type", String)
], FeePayment.prototype, "receivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], FeePayment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudentFee_1.StudentFee, studentFee => studentFee.payments),
    (0, typeorm_1.JoinColumn)({ name: 'student_fee_id' }),
    __metadata("design:type", StudentFee_1.StudentFee)
], FeePayment.prototype, "studentFee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.receivedPayments),
    (0, typeorm_1.JoinColumn)({ name: 'received_by' }),
    __metadata("design:type", User_1.User)
], FeePayment.prototype, "receivedByUser", void 0);
exports.FeePayment = FeePayment = __decorate([
    (0, typeorm_1.Entity)('fee_payments'),
    (0, typeorm_1.Index)(['studentFeeId']),
    (0, typeorm_1.Index)(['paymentDate'])
], FeePayment);
//# sourceMappingURL=FeePayment.js.map