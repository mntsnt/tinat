export function hasAnswer(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (value && typeof value === "object") {
    // If it's a household roster object with members
    if ("members" in value && Array.isArray((value as any).members)) {
      return (value as any).members.length > 0;
    }
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

      // If it's a household roster object, record the total count in numberValue and the roster JSON in textValue
      if (
        value &&
        typeof value === "object" &&
        "total" in value &&
        typeof (value as any).total === "number"
      ) {
        return {
          questionId,
          textValue: JSON.stringify(value),
          numberValue: (value as any).total,
        };
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
