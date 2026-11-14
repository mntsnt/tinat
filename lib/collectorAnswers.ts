export function hasAnswer(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasAnswer);
  }
  return false;
}

export function hasRequiredAnswer(value: unknown, requiredKeys?: string[]): boolean {
  if (!requiredKeys) return hasAnswer(value);
  if (requiredKeys.length === 0 || !value || typeof value !== "object") return false;

  const answers = value as Record<string, unknown>;
  return requiredKeys.every((key) => hasAnswer(answers[key]));
}

export function formatCollectorAnswers(
  answers: Record<string, unknown>
): { questionId: string; textValue: string | null; numberValue: number | null }[] {
  return Object.entries(answers)
    .filter(([, value]) => hasAnswer(value))
    .map(([questionId, value]) => {
      if (typeof value === "number") {
        return { questionId, textValue: null, numberValue: value };
      }

      return {
        questionId,
        textValue:
          typeof value === "string"
            ? value
            : JSON.stringify(value),
        numberValue: null,
      };
    });
}
