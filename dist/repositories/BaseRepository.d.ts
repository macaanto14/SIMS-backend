import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { BaseEntity } from '../entities/base/BaseEntity';
export declare abstract class BaseRepository<T extends BaseEntity> {
    protected repository: Repository<T>;
    constructor(repository: Repository<T>);
    findById(id: string): Promise<T | null>;
    findByIds(ids: string[]): Promise<T[]>;
    findAll(options?: FindManyOptions<T>): Promise<T[]>;
    findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]>;
    create(data: DeepPartial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    softDelete(id: string): Promise<boolean>;
    count(options?: FindManyOptions<T>): Promise<number>;
    exists(where: FindOptionsWhere<T>): Promise<boolean>;
}
//# sourceMappingURL=BaseRepository.d.ts.map