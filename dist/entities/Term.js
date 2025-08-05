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
exports.Term = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const AcademicYear_1 = require("./AcademicYear");
const Grade_1 = require("./Grade");
let Term = class Term extends BaseEntity_1.BaseEntity {
    get displayName() {
        if (!this.startDate || !this.endDate) {
            return this.name;
        }
        return `${this.name} (${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()})`;
    }
    get isCurrentPeriod() {
        if (!this.startDate || !this.endDate) {
            return false;
        }
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
    }
};
exports.Term = Term;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'academic_year_id' }),
    __metadata("design:type", String)
], Term.prototype, "academicYearId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Term.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'start_date' }),
    __metadata("design:type", Date)
], Term.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'end_date' }),
    __metadata("design:type", Date)
], Term.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_current' }),
    __metadata("design:type", Boolean)
], Term.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AcademicYear_1.AcademicYear, academicYear => academicYear.terms, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'academic_year_id' }),
    __metadata("design:type", AcademicYear_1.AcademicYear)
], Term.prototype, "academicYear", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Grade_1.Grade, grade => grade.term),
    __metadata("design:type", Array)
], Term.prototype, "grades", void 0);
exports.Term = Term = __decorate([
    (0, typeorm_1.Entity)('terms'),
    (0, typeorm_1.Index)(['academicYearId']),
    (0, typeorm_1.Index)(['isCurrent'])
], Term);
//# sourceMappingURL=Term.js.map