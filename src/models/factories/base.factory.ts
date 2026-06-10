import { ulid } from "ulid";

type WithId = {
  id: string;
};

export function buildEntity<T extends object>(
  data: T,
  extra?: Partial<T>,
): T & WithId {
  return {
    ...data,
    ...extra,
    id: ulid(),
  };
}
