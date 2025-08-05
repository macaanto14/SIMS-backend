import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, UpdateResult, DeleteResult } from 'typeorm';
import { BaseEntity } from '../entities/base/BaseEntity';

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected repository: Repository<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async findByIds(ids: string[]): Promise<T[]> {
    return this.repository.findByIds(ids);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repository.findAndCount(options);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result: DeleteResult = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result: UpdateResult = await this.repository.update(id, { isActive: false } as any);
    return (result.affected ?? 0) > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }
}