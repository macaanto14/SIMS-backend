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
exports.Class = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const School_1 = require("./School");
const AcademicYear_1 = require("./AcademicYear");
const StudentProfile_1 = require("./StudentProfile");
const Attendance_1 = require("./Attendance");
const FeeStructure_1 = require("./FeeStructure");
const Timetable_1 = require("./Timetable");
let Class = class Class extends BaseEntity_1.BaseEntity {
    get displayName() {
        return this.section ? `${this.name} - ${this.section}` : this.name;
    }
    get currentEnrollment() {
        return this.students?.filter(student => student.isActive).length || 0;
    }
    get hasCapacity() {
        if (!this.maxStudents)
            return true;
        return this.currentEnrollment < this.maxStudents;
    }
};
exports.Class = Class;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'school_id' }),
    __metadata("design:type", String)
], Class.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'academic_year_id' }),
    __metadata("design:type", String)
], Class.prototype, "academicYearId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Class.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'grade_level' }),
    __metadata("design:type", Number)
], Class.prototype, "gradeLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], Class.prototype, "section", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'class_teacher_id' }),
    __metadata("design:type", Object)
], Class.prototype, "classTeacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'max_students' }),
    __metadata("design:type", Object)
], Class.prototype, "maxStudents", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, name: 'room_number' }),
    __metadata("design:type", Object)
], Class.prototype, "roomNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], Class.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => School_1.School, school => school.classes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", School_1.School)
], Class.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AcademicYear_1.AcademicYear, academicYear => academicYear.classes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'academic_year_id' }),
    __metadata("design:type", AcademicYear_1.AcademicYear)
], Class.prototype, "academicYear", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StudentProfile_1.StudentProfile, student => student.class),
    __metadata("design:type", Array)
], Class.prototype, "students", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Attendance_1.Attendance, attendance => attendance.class),
    __metadata("design:type", Array)
], Class.prototype, "attendanceRecords", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FeeStructure_1.FeeStructure, feeStructure => feeStructure.class),
    __metadata("design:type", Array)
], Class.prototype, "feeStructures", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Timetable_1.Timetable, timetable => timetable.class),
    __metadata("design:type", Array)
], Class.prototype, "timetables", void 0);
exports.Class = Class = __decorate([
    (0, typeorm_1.Entity)('classes'),
    (0, typeorm_1.Index)(['schoolId']),
    (0, typeorm_1.Index)(['academicYearId']),
    (0, typeorm_1.Index)(['isActive'])
], Class);
//# sourceMappingURL=Class.js.map