import { ulid } from "ulid";
import z from "zod";

export function mapSchema<T>(input: object): {
return {
  ...input,
}
}
