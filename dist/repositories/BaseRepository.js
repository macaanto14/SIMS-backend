"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
        });
    }
    async findByIds(ids) {
        return this.repository.findByIds(ids);
    }
    async findAll(options) {
        return this.repository.find(options);
    }
    async findAndCount(options) {
        return this.repository.findAndCount(options);
    }
    async create(data) {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }
    async update(id, data) {
        await this.repository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
    async softDelete(id) {
        const result = await this.repository.update(id, { isActive: false });
        return (result.affected ?? 0) > 0;
    }
    async count(options) {
        return this.repository.count(options);
    }
    async exists(where) {
        const count = await this.repository.count({ where });
        return count > 0;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map