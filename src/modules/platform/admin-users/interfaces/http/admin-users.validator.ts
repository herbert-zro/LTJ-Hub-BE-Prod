export function validateGetByIdParams(id: unknown): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw Object.assign(new Error("Invalid id param"), { statusCode: 400 });
  }
  return parsed;
}
