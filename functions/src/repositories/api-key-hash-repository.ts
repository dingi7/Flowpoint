import {
  ApiKeyHash,
  ApiKeyHashData,
  ApiKeyHashRepository,
  DatabaseService,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getApiKeyHashRepository(
  databaseService: DatabaseService,
): ApiKeyHashRepository {
  return getGenericRepository<ApiKeyHash, ApiKeyHashData>(
    () => DatabaseCollection.API_KEY_HASHES,
    databaseService,
  );
}

