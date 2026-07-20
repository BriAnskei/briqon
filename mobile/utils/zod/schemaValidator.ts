import z from "zod";
import { ulid } from "ulid";

export function mapSchema<T>(input: object): {
return {
  ...input,
}
}
