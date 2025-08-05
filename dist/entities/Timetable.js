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
exports.Timetable = void 0;
const typeorm_1 = require("typeorm");
const BaseEntity_1 = require("./base/BaseEntity");
const Class_1 = require("./Class");
const Subject_1 = require("./Subject");
const TeacherProfile_1 = require("./TeacherProfile");
let Timetable = class Timetable extends BaseEntity_1.BaseEntity {
    get dayName() {
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[this.dayOfWeek] || 'Unknown';
    }
    get timeSlot() {
        return `${this.startTime} - ${this.endTime}`;
    }
    get displayName() {
        return `${this.subject.name} - ${this.dayName} ${this.timeSlot}`;
    }
};
exports.Timetable = Timetable;
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'class_id' }),
    __metadata("design:type", String)
], Timetable.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subject_id' }),
    __metadata("design:type", String)
], Timetable.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'teacher_id' }),
    __metadata("design:type", String)
], Timetable.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'day_of_week' }),
    __metadata("design:type", Number)
], Timetable.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'start_time' }),
    __metadata("design:type", String)
], Timetable.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'end_time' }),
    __metadata("design:type", String)
], Timetable.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'room_number' }),
    __metadata("design:type", Object)
], Timetable.prototype, "roomNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], Timetable.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Class_1.Class, classEntity => classEntity.timetables),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", Class_1.Class)
], Timetable.prototype, "class", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Subject_1.Subject, subject => subject.timetables),
    (0, typeorm_1.JoinColumn)({ name: 'subject_id' }),
    __metadata("design:type", Subject_1.Subject)
], Timetable.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => TeacherProfile_1.TeacherProfile, teacher => teacher.timetables),
    (0, typeorm_1.JoinColumn)({ name: 'teacher_id' }),
    __metadata("design:type", TeacherProfile_1.TeacherProfile)
], Timetable.prototype, "teacher", void 0);
exports.Timetable = Timetable = __decorate([
    (0, typeorm_1.Entity)('timetables'),
    (0, typeorm_1.Index)(['classId']),
    (0, typeorm_1.Index)(['subjectId']),
    (0, typeorm_1.Index)(['teacherId']),
    (0, typeorm_1.Index)(['dayOfWeek']),
    (0, typeorm_1.Index)(['isActive'])
], Timetable);
//# sourceMappingURL=Timetable.js.map