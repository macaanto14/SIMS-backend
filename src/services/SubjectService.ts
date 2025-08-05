import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Subject } from '../entities/Subject';
import { BaseRepository } from '../repositories/BaseRepository';

export class SubjectService extends BaseRepository<Subject> {
  private subjectRepository: Repository<Subject>;

  constructor() {
    const repository = AppDataSource.getRepository(Subject);
    super(repository);
    this.subjectRepository = repository;
  }

  async findBySchoolId(schoolId: string): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: { schoolId, isActive: true },
      relations: ['school'],
      order: { name: 'ASC' }
    });
  }

  async findByCode(schoolId: string, code: string): Promise<Subject | null> {
    return this.subjectRepository.findOne({
      where: { schoolId, code },
      relations: ['school']
    });
  }

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const subject = this.subjectRepository.create(data);
    return this.subjectRepository.save(subject);
  }

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    await this.subjectRepository.update(id, data);
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: ['school']
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    return subject;
  }

  async deleteSubject(id: string): Promise<void> {
    await this.subjectRepository.update(id, { isActive: false });
  }
}