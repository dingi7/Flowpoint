import { BaseEntity, GetOptions } from "@/core";

/**
 * Get next page param
 *
 * @template T
 *
 * @param {GetOptions} options
 *
 * @return (lastPage: T[]) => void
 */
export function getNextPageParam<T extends BaseEntity>(options: GetOptions) {
  return (lastPage: T[]) => {
    if (!lastPage.length) {
      return undefined;
    }

    const pageSize = options.pagination?.limit ?? 10;

    if (lastPage.length < pageSize) {
      return undefined;
    }

    return lastPage[lastPage.length - 1].id;
  };
}
