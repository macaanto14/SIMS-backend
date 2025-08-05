import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Class } from '../entities/Class';
import { BaseRepository } from '../repositories/BaseRepository';

export class ClassService extends BaseRepository<Class> {
  private classRepository: Repository<Class>;

  constructor() {
    const repository = AppDataSource.getRepository(Class);
    super(repository);
    this.classRepository = repository;
  }

  async findBySchoolId(schoolId: string): Promise<Class[]> {
    return this.classRepository.find({
      where: { schoolId, isActive: true },
      relations: ['school', 'academicYear', 'students'],
      order: { gradeLevel: 'ASC', name: 'ASC' }
    });
  }

  async findByAcademicYearId(academicYearId: string): Promise<Class[]> {
    return this.classRepository.find({
      where: { academicYearId, isActive: true },
      relations: ['school', 'academicYear', 'students'],
      order: { gradeLevel: 'ASC', name: 'ASC' }
    });
  }

  async findByGradeLevel(schoolId: string, gradeLevel: number): Promise<Class[]> {
    return this.classRepository.find({
      where: { schoolId, gradeLevel, isActive: true },
      relations: ['school', 'academicYear', 'students'],
      order: { name: 'ASC' }
    });
  }

  async createClass(data: Partial<Class>): Promise<Class> {
    const classEntity = this.classRepository.create(data);
    return this.classRepository.save(classEntity);
  }

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    await this.classRepository.update(id, data);
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['school', 'academicYear', 'students']
    });

    if (!classEntity) {
      throw new Error('Class not found');
    }

    return classEntity;
  }

  async deleteClass(id: string): Promise<void> {
    await this.classRepository.update(id, { isActive: false });
  }

  async getClassStatistics(schoolId: string): Promise<any> {
    const classes = await this.findBySchoolId(schoolId);
    
    return {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0),
      averageClassSize: classes.length > 0 
        ? classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0) / classes.length 
        : 0,
      gradeDistribution: classes.reduce((acc, cls) => {
        acc[cls.gradeLevel] = (acc[cls.gradeLevel] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    };
  }
}