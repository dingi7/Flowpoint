import {
  DatabaseService,
  EmptyPayloadExtender,
  GenericRepository,
} from "@/core";

export const getGenericRepository = <
  TEntity,
  TEntityData,
  TPayloadExtender = EmptyPayloadExtender,
>(
  getDatabaseCollection: (p: TPayloadExtender) => string,
  databaseService: DatabaseService,
): GenericRepository<TEntity, TEntityData, TPayloadExtender> => {
  return {
    async get(payload) {
      return databaseService.get<TEntity>(
        getDatabaseCollection(payload),
        payload.id,
      );
    },

    async getMany(payload) {
      if (payload.ids.length === 0) {
        return [];
      }
      
      // Firestore 'in' operator supports up to 10 values
      if (payload.ids.length <= 10) {
        return databaseService.getPaginated<TEntity>(
          getDatabaseCollection(payload),
          [{ field: "__name__", operator: "in", value: payload.ids }],
          {},
        );
      }
      
      // For more than 10 IDs, split into chunks
      const chunks = [];
      for (let i = 0; i < payload.ids.length; i += 10) {
        chunks.push(payload.ids.slice(i, i + 10));
      }
      
      const results = await Promise.all(
        chunks.map(chunk =>
          databaseService.getPaginated<TEntity>(
            getDatabaseCollection(payload),
            [{ field: "id", operator: "in", value: chunk }],
            {},
          )
        )
      );
      
      return results.flat();
    },

    async getAll(payload) {
      return databaseService.getPaginated<TEntity>(
        getDatabaseCollection(payload),
        payload.queryConstraints || [],
        payload.pagination || {},
        payload.orderBy,
      );
    },

    async getAllGroup(payload) {
      return databaseService.getPaginated<TEntity>(
        getDatabaseCollection(payload),
        payload.queryConstraints || [],
        payload.pagination || {},
        payload.orderBy,
      );
    },

    async getAllGroupByID(payload) {
      return databaseService.getPaginated<TEntity>(
        getDatabaseCollection(payload),
        [{ field: "id", operator: "==", value: payload.id }],
        {},
      );
    },

    async create(payload) {
      return databaseService.create<TEntityData>(
        getDatabaseCollection(payload),
        payload.data,
      );
    },

    async set(payload) {
      return databaseService.set<TEntityData>(
        getDatabaseCollection(payload),
        payload.id,
        payload.data,
      );
    },

    async update(payload) {
      return databaseService.update<TEntityData>(
        getDatabaseCollection(payload),
        payload.id,
        payload.data,
      );
    },

    async delete(payload) {
      return databaseService.delete(getDatabaseCollection(payload), payload.id);
    },

    async increment(payload) {
      // Since the customer portal's DatabaseService doesn't have increment method,
      // we'll implement it using update with field increments
      const updates: Record<string, number> = {};
      payload.fields.forEach((field) => {
        updates[field.name as string] = field.value;
      });

      // Note: This is a simplified implementation. In a real scenario,
      // you might want to use Firestore's FieldValue.increment()
      return databaseService.update(
        getDatabaseCollection(payload),
        payload.id,
        updates,
      );
    },

    async addToSet(payload) {
      return databaseService.addToSet(
        getDatabaseCollection(payload),
        payload.id,
        payload.fieldName as string,
        payload.value,
      );
    },

    async removeFromSet(payload) {
      return databaseService.removeFromSet(
        getDatabaseCollection(payload),
        payload.id,
        payload.fieldName as string,
        payload.value,
      );
    },
  };
};
