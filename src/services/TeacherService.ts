import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { TeacherProfile } from '../entities/TeacherProfile';
import { User } from '../entities/User';
import { BaseRepository } from '../repositories/BaseRepository';

export class TeacherService extends BaseRepository<TeacherProfile> {
  private teacherRepository: Repository<TeacherProfile>;
  private userRepository: Repository<User>;

  constructor() {
    const repository = AppDataSource.getRepository(TeacherProfile);
    super(repository);
    this.teacherRepository = repository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  async findBySchoolId(schoolId: string): Promise<TeacherProfile[]> {
    return this.teacherRepository.find({
      where: { schoolId, isActive: true },
      relations: ['user', 'school'],
      order: { hireDate: 'DESC' }
    });
  }

  async findByEmployeeId(employeeId: string): Promise<TeacherProfile | null> {
    return this.teacherRepository.findOne({
      where: { employeeId },
      relations: ['user', 'school']
    });
  }

  async findBySpecialization(schoolId: string, specialization: string): Promise<TeacherProfile[]> {
    return this.teacherRepository.find({
      where: { schoolId, specialization, isActive: true },
      relations: ['user', 'school'],
      order: { user: { firstName: 'ASC' } }
    });
  }

  async createTeacher(userData: Partial<User>, teacherData: Partial<TeacherProfile>): Promise<TeacherProfile> {
    // Create user first
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Create teacher profile
    const teacher = this.teacherRepository.create({
      ...teacherData,
      userId: savedUser.id
    });

    return this.teacherRepository.save(teacher);
  }

  async updateTeacher(id: string, userData: Partial<User>, teacherData: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Update user data
    if (userData && Object.keys(userData).length > 0) {
      await this.userRepository.update(teacher.userId, userData);
    }

    // Update teacher data
    if (teacherData && Object.keys(teacherData).length > 0) {
      await this.teacherRepository.update(id, teacherData);
    }

    return this.teacherRepository.findOne({
      where: { id },
      relations: ['user', 'school']
    }) as Promise<TeacherProfile>;
  }

  async deleteTeacher(id: string): Promise<void> {
    await this.teacherRepository.update(id, { isActive: false });
  }

  async getTeacherStatistics(schoolId: string): Promise<any> {
    const teachers = await this.findBySchoolId(schoolId);
    
    const specializationDistribution = teachers.reduce((acc, teacher) => {
      const specialization = teacher.specialization || 'General';
      acc[specialization] = (acc[specialization] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const experienceDistribution = teachers.reduce((acc, teacher) => {
      const experience = teacher.experienceYears || 0;
      const expGroup = experience < 2 ? 'Fresher' : experience < 5 ? '2-5 years' : experience < 10 ? '5-10 years' : '10+ years';
      acc[expGroup] = (acc[expGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter(t => t.isActive).length,
      specializationDistribution,
      experienceDistribution,
      averageExperience: teachers.length > 0 
        ? teachers.reduce((sum, t) => sum + (t.experienceYears || 0), 0) / teachers.length 
        : 0
    };
  }
}