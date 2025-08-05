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
exports.FeeStructure = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const School_1 = require("./School");
const AcademicYear_1 = require("./AcademicYear");
const Class_1 = require("./Class");
const StudentFee_1 = require("./StudentFee");
let FeeStructure = class FeeStructure extends BaseEntity_1.BaseEntity {
    get displayName() {
        return `${this.feeType} - ${this.amount}`;
    }
};
exports.FeeStructure = FeeStructure;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'school_id' }),
    __metadata("design:type", String)
], FeeStructure.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'academic_year_id' }),
    __metadata("design:type", String)
], FeeStructure.prototype, "academicYearId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'class_id' }),
    __metadata("design:type", Object)
], FeeStructure.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'fee_type' }),
    __metadata("design:type", String)
], FeeStructure.prototype, "feeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], FeeStructure.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'monthly' }),
    __metadata("design:type", String)
], FeeStructure.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'due_date_rule' }),
    __metadata("design:type", Object)
], FeeStructure.prototype, "dueDateRule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_mandatory' }),
    __metadata("design:type", Boolean)
], FeeStructure.prototype, "isMandatory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], FeeStructure.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.feeStructures),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], FeeStructure.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AcademicYear_1.AcademicYear, academicYear => academicYear.feeStructures),
    (0, typeorm_1.JoinColumn)({ name: 'academic_year_id' }),
    __metadata("design:type", AcademicYear_1.AcademicYear)
], FeeStructure.prototype, "academicYear", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Class_1.Class, classEntity => classEntity.feeStructures, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", Object)
], FeeStructure.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StudentFee_1.StudentFee, studentFee => studentFee.feeStructure),
    __metadata("design:type", Array)
], FeeStructure.prototype, "studentFees", void 0);
exports.FeeStructure = FeeStructure = __decorate([
    (0, typeorm_1.Entity)('fee_structures'),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['academicYearId']),
    (0, typeorm_1.Index)(['isActive'])
], FeeStructure);
//# sourceMappingURL=FeeStructure.js.map