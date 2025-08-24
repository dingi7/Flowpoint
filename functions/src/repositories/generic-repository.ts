import {
  DatabaseService,
  EmptyPayloadExtender,
  GenericRepository,
} from "@/core";
import { firestore } from "firebase-admin";
import FieldPath = firestore.FieldPath;

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
        return databaseService.getAllByFields<TEntity>(
          getDatabaseCollection(payload),
          [{ field: "id", operator: "in", value: payload.ids }],
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
          databaseService.getAllByFields<TEntity>(
            getDatabaseCollection(payload),
            [{ field: "id", operator: "in", value: chunk }],
            {},
          )
        )
      );
      
      return results.flat();
    },
    async getAll(payload) {
      return databaseService.getAllByFields<TEntity>(
        getDatabaseCollection(payload),
        payload.queryConstraints || [],
        payload.pagination || {},
        payload.orderBy,
      );
    },
    async getAllGroup(payload) {
      return databaseService.getAllGroup<TEntity>(
        getDatabaseCollection(payload),
        payload.queryConstraints || [],
        payload.pagination || {},
        payload.orderBy,
      );
    },
    async getAllGroupByID(payload) {
      return databaseService.getAllGroup<TEntity>(
        getDatabaseCollection(payload),
        [
          {
            field: FieldPath.documentId(),
            operator: "==",
            value: payload.id,
          },
        ],
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
    batchSet(payload) {
      return databaseService.batchSet<TEntityData>(
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
      for (const field of payload.fields) {
        await databaseService.increment(
          getDatabaseCollection(payload),
          payload.id,
          field.name as string,
          field.value,
        );
      }
    },
    async addToSet(payload) {
      return databaseService.addToSet<TEntityData>(
        getDatabaseCollection(payload),
        payload.id,
        payload.fieldName,
        payload.value,
      );
    },
    async removeFromSet(payload) {
      return databaseService.removeFromSet<TEntityData>(
        getDatabaseCollection(payload),
        payload.id,
        payload.fieldName,
        payload.value,
      );
    },
  };
};
