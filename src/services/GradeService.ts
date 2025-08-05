import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Grade } from '../entities/Grade';
import { BaseRepository } from '../repositories/BaseRepository';

export class GradeService extends BaseRepository<Grade> {
  private gradeRepository: Repository<Grade>;

  constructor() {
    const repository = AppDataSource.getRepository(Grade);
    super(repository);
    this.gradeRepository = repository;
  }

  async findByStudentId(studentId: string): Promise<Grade[]> {
    return this.gradeRepository.find({
      where: { studentId },
      relations: ['subject', 'term', 'assessedByUser'],
      order: { assessmentDate: 'DESC' }
    });
  }

  async findByStudentAndTerm(studentId: string, termId: string): Promise<Grade[]> {
    return this.gradeRepository.find({
      where: { studentId, termId },
      relations: ['subject', 'assessedByUser'],
      order: { subject: { name: 'ASC' } }
    });
  }

  async findBySubjectAndTerm(subjectId: string, termId: string): Promise<Grade[]> {
    return this.gradeRepository.find({
      where: { subjectId, termId },
      relations: ['student', 'assessedByUser'],
      order: { student: { user: { firstName: 'ASC' } } }
    });
  }

  async calculateTermGPA(studentId: string, termId: string): Promise<number> {
    const grades = await this.findByStudentAndTerm(studentId, termId);
    
    if (grades.length === 0) return 0;

    const totalPoints = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    return totalPoints / grades.length;
  }

  async getClassGradeStatistics(classId: string, termId: string): Promise<any> {
    const grades = await this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoin('grade.student', 'student')
      .leftJoin('student.class', 'class')
      .leftJoin('grade.subject', 'subject')
      .where('class.id = :classId', { classId })
      .andWhere('grade.termId = :termId', { termId })
      .select([
        'subject.name as subjectName',
        'AVG(grade.marksObtained / grade.totalMarks * 100) as averagePercentage',
        'MAX(grade.marksObtained / grade.totalMarks * 100) as highestPercentage',
        'MIN(grade.marksObtained / grade.totalMarks * 100) as lowestPercentage',
        'COUNT(*) as totalStudents'
      ])
      .groupBy('subject.id, subject.name')
      .getRawMany();

    return grades;
  }
}