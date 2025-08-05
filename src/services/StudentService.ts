import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { StudentProfile } from '../entities/StudentProfile';
import { User } from '../entities/User';
import { BaseRepository } from '../repositories/BaseRepository';

export class StudentService extends BaseRepository<StudentProfile> {
  private studentRepository: Repository<StudentProfile>;
  private userRepository: Repository<User>;

  constructor() {
    const repository = AppDataSource.getRepository(StudentProfile);
    super(repository);
    this.studentRepository = repository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  async findBySchoolId(schoolId: string): Promise<StudentProfile[]> {
    return this.studentRepository.find({
      where: { schoolId, isActive: true },
      relations: ['user', 'school', 'class'],
      order: { admissionDate: 'DESC' }
    });
  }

  async findByClassId(classId: string): Promise<StudentProfile[]> {
    return this.studentRepository.find({
      where: { class: { id: classId }, isActive: true },
      relations: ['user', 'school', 'class'],
      order: { user: { firstName: 'ASC' } }
    });
  }

  async findByStudentId(studentId: string): Promise<StudentProfile | null> {
    return this.studentRepository.findOne({
      where: { studentId },
      relations: ['user', 'school', 'class']
    });
  }

  async createStudent(userData: Partial<User>, studentData: Partial<StudentProfile>): Promise<StudentProfile> {
    // Create user first
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Create student profile
    const student = this.studentRepository.create({
      ...studentData,
      userId: savedUser.id
    });

    return this.studentRepository.save(student);
  }

  async updateStudent(id: string, userData: Partial<User>, studentData: Partial<StudentProfile>): Promise<StudentProfile> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Update user data
    if (userData && Object.keys(userData).length > 0) {
      await this.userRepository.update(student.userId, userData);
    }

    // Update student data
    if (studentData && Object.keys(studentData).length > 0) {
      await this.studentRepository.update(id, studentData);
    }

    return this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'school', 'class']
    }) as Promise<StudentProfile>;
  }

  async deleteStudent(id: string): Promise<void> {
    await this.studentRepository.update(id, { isActive: false });
  }

  async getStudentStatistics(schoolId: string): Promise<any> {
    const students = await this.findBySchoolId(schoolId);
    
    const genderDistribution = students.reduce((acc, student) => {
      const gender = student.gender || 'unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageDistribution = students.reduce((acc, student) => {
      const age = student.age;
      const ageGroup = age < 6 ? 'Under 6' : age < 12 ? '6-11' : age < 18 ? '12-17' : '18+';
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.isActive).length,
      genderDistribution,
      ageDistribution,
      averageAge: students.length > 0 
        ? students.reduce((sum, s) => sum + s.age, 0) / students.length 
        : 0
    };
  }
}