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
exports.Grade = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const StudentProfile_1 = require("./StudentProfile");
const Subject_1 = require("./Subject");
const Term_1 = require("./Term");
const User_1 = require("./User");
let Grade = class Grade extends BaseEntity_1.BaseEntity {
    get percentage() {
        return this.totalMarks > 0 ? (this.marksObtained / this.totalMarks) * 100 : 0;
    }
    get isPassing() {
        return this.percentage >= 50;
    }
};
exports.Grade = Grade;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'student_id' }),
    __metadata("design:type", String)
], Grade.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subject_id' }),
    __metadata("design:type", String)
], Grade.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'term_id' }),
    __metadata("design:type", String)
], Grade.prototype, "termId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'assessment_type' }),
    __metadata("design:type", String)
], Grade.prototype, "assessmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'assessment_name' }),
    __metadata("design:type", String)
], Grade.prototype, "assessmentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', name: 'marks_obtained' }),
    __metadata("design:type", Number)
], Grade.prototype, "marksObtained", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', name: 'total_marks' }),
    __metadata("design:type", Number)
], Grade.prototype, "totalMarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Grade.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Grade.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assessed_by' }),
    __metadata("design:type", String)
], Grade.prototype, "assessedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'assessment_date' }),
    __metadata("design:type", Date)
], Grade.prototype, "assessmentDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudentProfile_1.StudentProfile, student => student.grades),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", StudentProfile_1.StudentProfile)
], Grade.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Subject_1.Subject, subject => subject.grades),
    (0, typeorm_1.JoinColumn)({ name: 'subject_id' }),
    __metadata("design:type", Subject_1.Subject)
], Grade.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Term_1.Term, term => term.grades),
    (0, typeorm_1.JoinColumn)({ name: 'term_id' }),
    __metadata("design:type", Term_1.Term)
], Grade.prototype, "term", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.assessedGrades),
    (0, typeorm_1.JoinColumn)({ name: 'assessed_by' }),
    __metadata("design:type", User_1.User)
], Grade.prototype, "assessedByUser", void 0);
exports.Grade = Grade = __decorate([
    (0, typeorm_1.Entity)('grades'),
    (0, typeorm_1.Index)(['studentId']),
    (0, typeorm_1.Index)(['subjectId']),
    (0, typeorm_1.Index)(['termId'])
], Grade);
//# sourceMappingURL=Grade.js.map