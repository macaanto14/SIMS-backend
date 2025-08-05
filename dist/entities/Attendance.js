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
exports.Attendance = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const StudentProfile_1 = require("./StudentProfile");
const Class_1 = require("./Class");
const User_1 = require("./User");
let Attendance = class Attendance extends BaseEntity_1.BaseEntity {
    get isPresent() {
        return this.status === 'present';
    }
    get displayStatus() {
        return this.status.charAt(0).toUpperCase() + this.status.slice(1);
    }
};
exports.Attendance = Attendance;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'student_id' }),
    __metadata("design:type", String)
], Attendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'class_id' }),
    __metadata("design:type", String)
], Attendance.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Attendance.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Attendance.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'marked_by' }),
    __metadata("design:type", String)
], Attendance.prototype, "markedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Attendance.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudentProfile_1.StudentProfile, student => student.attendanceRecords),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", StudentProfile_1.StudentProfile)
], Attendance.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Class_1.Class, classEntity => classEntity.attendanceRecords),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", Class_1.Class)
], Attendance.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.markedAttendance),
    (0, typeorm_1.JoinColumn)({ name: 'marked_by' }),
    __metadata("design:type", User_1.User)
], Attendance.prototype, "markedByUser", void 0);
exports.Attendance = Attendance = __decorate([
    (0, typeorm_1.Entity)('attendance'),
    (0, typeorm_1.Index)(['studentId', 'date'], { unique: true }),
    (0, typeorm_1.Index)(['classId']),
    (0, typeorm_1.Index)(['date'])
], Attendance);
//# sourceMappingURL=Attendance.js.map