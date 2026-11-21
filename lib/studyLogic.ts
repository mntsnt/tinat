/**
 * Real-Time Logic Branching & Dynamic Household Rosters Engine for Tinat
 *
 * Implements:
 * 1. Condition evaluation & skip-logic (branching)
 * 2. Dynamic roster data structures & auto-calculation
 */

export interface SkipRule {
  targetOrder: number; // 1-based question order that will be skipped/shown
  dependsOnOrder: number; // 1-based question order condition depends on
  condition:
    | "EQUALS"
    | "NOT_EQUALS"
    | "GREATER_THAN"
    | "LESS_THAN_OR_EQUAL"
    | "IN"
    | "NOT_IN"
    | "CONTAINS";
  value: any;
  action: "SHOW_IF" | "HIDE_IF";
  skipReason: string;
}

export interface HouseholdMember {
  id: string;
  role: string;
  sex: "Male" | "Female";
  age: number | string;
  maritalStatus: "Single" | "Single (Never Married)" | "Married" | "Divorced" | "Widowed";
  education:
    | "Unable to read and write (Illiterate)"
    | "Able only to read and write"
    | "Primary school (Grades 1-8)"
    | "Secondary school (Grades 9-12)"
    | "College / University graduate (12+)";
}

export interface HouseholdRosterData {
  total: number;
  maleCount: number;
  femaleCount: number;
  members: HouseholdMember[];
}

/**
 * Built-in Skip Logic Rules for Community Health & Census Questionnaires
 * Supports Melka Nono / SPHMMC 68-indicator survey and standard clinical surveys
 */
export const DEFAULT_STUDY_SKIP_RULES: SkipRule[] = [
  // Q18 -> Q19: If infant deaths <= 0, skip cause of infant death
  {
    targetOrder: 19,
    dependsOnOrder: 18,
    condition: "LESS_THAN_OR_EQUAL",
    value: 0,
    action: "HIDE_IF",
    skipReason: "No infant deaths recorded (0 deaths in last 12 months)",
  },
  // Q20 -> Q21: If child deaths <= 0, skip cause of child death
  {
    targetOrder: 21,
    dependsOnOrder: 20,
    condition: "LESS_THAN_OR_EQUAL",
    value: 0,
    action: "HIDE_IF",
    skipReason: "No under-five child deaths recorded in last 12 months",
  },
  // Q27 -> Q28: If currently pregnant == "No", skip unintended pregnancy
  {
    targetOrder: 28,
    dependsOnOrder: 27,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No pregnancy reported in household",
  },
  // Q30 -> Q31 & Q32: If mothers gave birth == "No", skip delivery place & home delivery reason
  {
    targetOrder: 31,
    dependsOnOrder: 30,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No childbirths in the last 12 months",
  },
  {
    targetOrder: 32,
    dependsOnOrder: 30,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No childbirths in the last 12 months",
  },
  // Q31 -> Q32: If place of delivery is NOT "At home", skip home delivery reason
  {
    targetOrder: 32,
    dependsOnOrder: 31,
    condition: "NOT_EQUALS",
    value: "At home",
    action: "HIDE_IF",
    skipReason: "Delivery was not conducted at home",
  },
  // Q33 -> Q34: If abortion == "No", skip abortion care site
  {
    targetOrder: 34,
    dependsOnOrder: 33,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No abortion reported in the last 12 months",
  },
  // Q35 -> Q36 & Q37: Family planning branching
  {
    targetOrder: 36,
    dependsOnOrder: 35,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "Household does not use modern family planning",
  },
  {
    targetOrder: 37,
    dependsOnOrder: 35,
    condition: "EQUALS",
    value: "Yes",
    action: "HIDE_IF",
    skipReason: "Household is actively using family planning",
  },
  // Q41 -> Q42 & Q43: If under-one child == "No", skip vaccination status
  {
    targetOrder: 42,
    dependsOnOrder: 41,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No under-one year children residing in household",
  },
  {
    targetOrder: 43,
    dependsOnOrder: 41,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "No under-one year children residing in household",
  },
  // Q42 -> Q43: If vaccination is "Complete" or "Up to date", skip reason for incomplete
  {
    targetOrder: 43,
    dependsOnOrder: 42,
    condition: "IN",
    value: ["Up to date", "Complete"],
    action: "HIDE_IF",
    skipReason: "Child vaccination is already up to date / complete",
  },
  // Q54 -> Q55: If treat water == "No", skip treatment method
  {
    targetOrder: 55,
    dependsOnOrder: 54,
    condition: "EQUALS",
    value: "No",
    action: "HIDE_IF",
    skipReason: "Household does not treat drinking water",
  },
  // Q59 -> Q60, 61, 62, 63: If latrine == "No latrine (Open field defecation)", skip latrine maintenance questions
  {
    targetOrder: 60,
    dependsOnOrder: 59,
    condition: "EQUALS",
    value: "No latrine (Open field defecation)",
    action: "HIDE_IF",
    skipReason: "No latrine facility in compound (open field defecation)",
  },
  {
    targetOrder: 61,
    dependsOnOrder: 59,
    condition: "EQUALS",
    value: "No latrine (Open field defecation)",
    action: "HIDE_IF",
    skipReason: "No latrine facility in compound",
  },
  {
    targetOrder: 62,
    dependsOnOrder: 59,
    condition: "EQUALS",
    value: "No latrine (Open field defecation)",
    action: "HIDE_IF",
    skipReason: "No latrine facility in compound",
  },
  {
    targetOrder: 63,
    dependsOnOrder: 59,
    condition: "EQUALS",
    value: "No latrine (Open field defecation)",
    action: "HIDE_IF",
    skipReason: "No latrine facility in compound",
  },
];

/**
 * Checks whether a given question should be skipped based on recorded answers
 */
export function isQuestionSkipped(
  questionOrder: number, // 1-based index
  questions: { id: string; order: number }[],
  answers: Record<string, any>,
  customRules: SkipRule[] = DEFAULT_STUDY_SKIP_RULES
): { skipped: boolean; reason?: string } {
  // Find rules that target this question order
  const rules = customRules.filter((r) => r.targetOrder === questionOrder);
  if (rules.length === 0) return { skipped: false };

  for (const rule of rules) {
    const parentQuestion = questions.find((q) => q.order === rule.dependsOnOrder - 1);
    if (!parentQuestion) continue;

    const parentAnswer = answers[parentQuestion.id];
    // If parent has not been answered yet, do not skip
    if (parentAnswer === undefined || parentAnswer === null || parentAnswer === "") {
      continue;
    }

    let conditionMet = false;
    const answerVal = typeof parentAnswer === "number" ? parentAnswer : String(parentAnswer).trim();

    switch (rule.condition) {
      case "EQUALS":
        conditionMet = String(answerVal).toLowerCase() === String(rule.value).toLowerCase();
        break;
      case "NOT_EQUALS":
        conditionMet = String(answerVal).toLowerCase() !== String(rule.value).toLowerCase();
        break;
      case "LESS_THAN_OR_EQUAL":
        conditionMet = Number(answerVal) <= Number(rule.value);
        break;
      case "GREATER_THAN":
        conditionMet = Number(answerVal) > Number(rule.value);
        break;
      case "IN":
        if (Array.isArray(rule.value)) {
          conditionMet = rule.value.some(
            (v) => String(v).toLowerCase() === String(answerVal).toLowerCase()
          );
        }
        break;
      case "NOT_IN":
        if (Array.isArray(rule.value)) {
          conditionMet = !rule.value.some(
            (v) => String(v).toLowerCase() === String(answerVal).toLowerCase()
          );
        }
        break;
      case "CONTAINS":
        conditionMet = String(answerVal).toLowerCase().includes(String(rule.value).toLowerCase());
        break;
    }

    if (rule.action === "HIDE_IF" && conditionMet) {
      return { skipped: true, reason: rule.skipReason };
    }
    if (rule.action === "SHOW_IF" && !conditionMet) {
      return { skipped: true, reason: rule.skipReason };
    }
  }

  return { skipped: false };
}

/**
 * Finds next non-skipped question index
 */
export function getNextActiveStep(
  currentStep: number, // 0-based
  questions: { id: string; order: number }[],
  answers: Record<string, any>,
  rules: SkipRule[] = DEFAULT_STUDY_SKIP_RULES
): number {
  let step = currentStep + 1;
  while (step < questions.length) {
    const { skipped } = isQuestionSkipped(step + 1, questions, answers, rules);
    if (!skipped) return step;
    step++;
  }
  return questions.length; // Review screen
}

/**
 * Finds previous non-skipped question index
 */
export function getPreviousActiveStep(
  currentStep: number, // 0-based
  questions: { id: string; order: number }[],
  answers: Record<string, any>,
  rules: SkipRule[] = DEFAULT_STUDY_SKIP_RULES
): number {
  let step = currentStep - 1;
  while (step >= 0) {
    const { skipped } = isQuestionSkipped(step + 1, questions, answers, rules);
    if (!skipped) return step;
    step--;
  }
  return -1; // Consent screen
}

/**
 * Helper to initialize or normalize a Dynamic Household Roster
 */
export function createDefaultRoster(totalMembers: number = 1): HouseholdRosterData {
  const count = Math.max(1, Math.min(25, Number(totalMembers) || 1));
  const members: HouseholdMember[] = [];

  for (let i = 0; i < count; i++) {
    members.push({
      id: `member-${i + 1}`,
      role: i === 0 ? "Household Head" : i === 1 ? "Spouse" : "Child",
      sex: i === 0 ? "Male" : "Female",
      age: i === 0 ? 35 : i === 1 ? 30 : 8,
      maritalStatus: i === 0 || i === 1 ? "Married" : "Single",
      education: i === 0 ? "Secondary school (Grades 9-12)" : "Primary school (Grades 1-8)",
    });
  }

  return {
    total: count,
    maleCount: members.filter((m) => m.sex === "Male").length,
    femaleCount: members.filter((m) => m.sex === "Female").length,
    members,
  };
}
