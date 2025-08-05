import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AcademicYear } from '../entities/AcademicYear';
import { BaseRepository } from '../repositories/BaseRepository';

export class AcademicYearService extends BaseRepository<AcademicYear> {
  private academicYearRepository: Repository<AcademicYear>;

  constructor() {
    const repository = AppDataSource.getRepository(AcademicYear);
    super(repository);
    this.academicYearRepository = repository;
  }

  async findBySchoolId(schoolId: string): Promise<AcademicYear[]> {
    return this.academicYearRepository.find({
      where: { schoolId },
      relations: ['school', 'classes', 'terms'],
      order: { startDate: 'DESC' }
    });
  }

  async findCurrentBySchoolId(schoolId: string): Promise<AcademicYear | null> {
    return this.academicYearRepository.findOne({
      where: { schoolId, isCurrent: true },
      relations: ['school', 'classes', 'terms']
    });
  }

  async setCurrentAcademicYear(schoolId: string, academicYearId: string): Promise<AcademicYear> {
    // First, unset all current academic years for this school
    await this.academicYearRepository.update(
      { schoolId },
      { isCurrent: false }
    );

    // Then set the specified one as current
    await this.academicYearRepository.update(
      { id: academicYearId, schoolId },
      { isCurrent: true }
    );

    const academicYear = await this.academicYearRepository.findOne({
      where: { id: academicYearId },
      relations: ['school', 'classes', 'terms']
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    return academicYear;
  }

  async createAcademicYear(data: Partial<AcademicYear>): Promise<AcademicYear> {
    const academicYear = this.academicYearRepository.create(data);
    return this.academicYearRepository.save(academicYear);
  }

  async updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear> {
    await this.academicYearRepository.update(id, data);
    const academicYear = await this.academicYearRepository.findOne({
      where: { id },
      relations: ['school', 'classes', 'terms']
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    return academicYear;
  }

  async deleteAcademicYear(id: string): Promise<void> {
    const result = await this.academicYearRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Academic year not found');
    }
  }
}