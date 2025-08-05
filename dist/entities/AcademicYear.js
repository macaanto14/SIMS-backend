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
exports.AcademicYear = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const School_1 = require("./School");
const Class_1 = require("./Class");
let AcademicYear = class AcademicYear extends BaseEntity_1.BaseEntity {
    get displayName() {
        return `${this.name} (${this.startDate.getFullYear()}-${this.endDate.getFullYear()})`;
    }
    get isCurrentPeriod() {
        const now = new Date();
        return now >= this.startDate && now <= this.endDate;
    }
};
exports.AcademicYear = AcademicYear;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AcademicYear.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], AcademicYear.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], AcademicYear.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AcademicYear.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], AcademicYear.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AcademicYear.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.academicYears, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], AcademicYear.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Class_1.Class, classEntity => classEntity.academicYear),
    __metadata("design:type", Array)
], AcademicYear.prototype, "classes", void 0);
exports.AcademicYear = AcademicYear = __decorate([
    (0, typeorm_1.Entity)('academic_years'),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['isCurrent'])
], AcademicYear);
//# sourceMappingURL=AcademicYear.js.map