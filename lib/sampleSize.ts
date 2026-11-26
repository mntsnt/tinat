export type SampleSizeResult = {
  value: number | null;
  base: number | null;
  nonResponse: number | null;
  formula: string;
  variables: Record<string, string>;
  steps: string[];
  interpretation: string;
  assumptions: string[];
};

const zTable: Record<number, number> = { 0.80: 1.282, 0.85: 1.44, 0.90: 1.645, 0.95: 1.96, 0.99: 2.576 };
function zFor(confidence: number) { return zTable[Number(confidence.toFixed(2))] || 1.96; }

function adjustment(base: number, nonResponse: number, population?: number, designEffect = 1) {
  if (!Number.isFinite(base) || base <= 0) return null;
  let value = Math.ceil(base);
  if (designEffect > 0) value = Math.ceil(value * designEffect);
  if (nonResponse > 0 && nonResponse < 100) value = Math.ceil(value / (1 - nonResponse / 100));
  if (population && population > 0) value = Math.min(value, population);
  return value;
}

export function singleProportion(p: number, margin: number, confidence: number, population?: number, nonResponse = 0, designEffect = 1): SampleSizeResult {
  if (!(p > 0 && p < 1) || !(margin > 0 && margin < 1) || !(confidence > 0 && confidence < 1)) return invalid("Use 0 < p < 1, 0 < margin < 1, and 0 < confidence < 1.");
  const z = zFor(confidence);
  const raw = (z * z * p * (1 - p)) / (margin * margin);
  let base = raw;
  if (population && population > 0) base = (raw * population) / (raw + population - 1);
  const adjusted = adjustment(base, nonResponse, population, designEffect);
  return {
    value: adjusted,
    base: Math.ceil(base),
    nonResponse: nonResponse > 0 && nonResponse < 100 ? Math.ceil(base / (1 - nonResponse / 100)) : null,
    formula: population && population > 0
      ? "n = [z²p(1-p)/d²] / [1 + ((z²p(1-p)/d²)-1)/N]"
      : "n = z²p(1-p)/d²",
    variables: { z: "standard normal value", p: "expected proportion", d: "absolute precision", N: "finite population size", DEFF: "design effect", NR: "anticipated non-response rate" },
    steps: [`z = ${z}`, `p(1-p) = ${p * (1 - p)}`, `d² = ${margin * margin}`, `Initial n = ${raw.toFixed(3)}`, population ? `Finite-population adjusted n = ${base.toFixed(3)}` : "No finite-population correction", designEffect > 1 ? `Design effect × ${designEffect}` : "No cluster design effect", nonResponse > 0 ? `Divide by (1 - ${nonResponse / 100})` : "No non-response adjustment"],
    interpretation: `Plan for approximately ${adjusted ?? "an indeterminate"} participants.`,
    assumptions: ["Simple random sampling or equivalent independence.", "The stated p is plausible.", "The margin d is absolute proportion precision.", "Cluster design effects require cluster-size assumptions and a statistician review."],
  };
}

export function singleMean(mean: number, standardDeviation: number, margin: number, confidence: number, population?: number, nonResponse = 0, designEffect = 1): SampleSizeResult {
  void mean;
  if (!(standardDeviation > 0) || !(margin > 0) || !(confidence > 0 && confidence < 1)) return invalid("Standard deviation and margin must be positive; confidence must be between 0 and 1.");
  const z = zFor(confidence);
  const raw = (z * z * standardDeviation * standardDeviation) / (margin * margin);
  let base = raw;
  if (population && population > 0) base = (raw * population) / (raw + population - 1);
  const adjusted = adjustment(base, nonResponse, population, designEffect);
  return {
    value: adjusted,
    base: Math.ceil(base),
    nonResponse: nonResponse > 0 && nonResponse < 100 ? Math.ceil(base / (1 - nonResponse / 100)) : null,
    formula: population ? "n = [(zσ/d)² × N] / [(zσ/d)² + N - 1]" : "n = (zσ/d)²",
    variables: { z: "standard normal value", σ: "population standard deviation", d: "absolute precision", N: "finite population size", DEFF: "design effect", NR: "anticipated non-response rate" },
    steps: [`z = ${z}`, `σ = ${standardDeviation}`, `d = ${margin}`, `Initial n = ${raw.toFixed(3)}`, population ? `Finite-population adjusted n = ${base.toFixed(3)}` : "No finite-population correction"],
    interpretation: `Plan for approximately ${adjusted ?? "an indeterminate"} participants.`,
    assumptions: ["Random sampling.", "The standard deviation is a reliable estimate.", "Normal approximation or an appropriate mean inference method.", "The mean value itself is not used in this formula, only the margin and standard deviation."],
  };
}

export function twoProportions(p1: number, p2: number, power: number, confidence: number, allocation = 1, nonResponse = 0, designEffect = 1): SampleSizeResult {
  if (!(p1 > 0 && p1 < 1) || !(p2 > 0 && p2 < 1) || !(power > 0 && power < 1) || !(confidence > 0 && confidence < 1) || !(allocation > 0)) return invalid("Use valid proportions, confidence, power and allocation ratio.");
  const zAlpha = zFor(confidence);
  const zBeta = zFor(power);
  const pooled = (p1 + allocation * p2) / (1 + allocation);
  const rawPerArm = ((zAlpha * Math.sqrt(2 * pooled * (1 - pooled)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / ((p1 - p2) ** 2);
  const base = rawPerArm * (1 + 1 / allocation);
  const adjusted = adjustment(base, nonResponse, undefined, designEffect);
  return {
    value: adjusted,
    base: Math.ceil(base),
    nonResponse: nonResponse > 0 && nonResponse < 100 ? Math.ceil(base / (1 - nonResponse / 100)) : null,
    formula: "n_total ≈ 2[zα√(2p̄(1-p̄)) + zβ√(p₁(1-p₁)+p₂(1-p₂))]² / (p₁-p₂)²",
    variables: { zα: "two-sided confidence critical value", zβ: "power critical value", p1: "expected proportion in group 1", p2: "expected proportion in group 2", r: "allocation ratio" },
    steps: [`zα = ${zAlpha}`, `zβ = ${zBeta}`, `Pooled approximate p̄ = ${pooled}`, `Effect difference = ${p1 - p2}`, `Initial total n = ${rawPerArm.toFixed(3)} per-arm adjustment; final base = ${base.toFixed(3)}`],
    interpretation: `Plan for approximately ${adjusted ?? "an indeterminate"} participants across both groups.`,
    assumptions: ["Independent groups.", "Approximate two-sided normal formula.", "Adequate expected event counts.", "Validate exact or continuity-corrected formulas for small samples."],
  };
}

export function twoMeans(meanDifference: number, standardDeviation: number, power: number, confidence: number, allocation = 1, nonResponse = 0, designEffect = 1): SampleSizeResult {
  if (!(standardDeviation > 0) || !(meanDifference > 0) || !(power > 0 && power < 1) || !(confidence > 0 && confidence < 1) || !(allocation > 0)) return invalid("Use a positive mean difference and standard deviation, and valid power/confidence.");
  const zAlpha = zFor(confidence);
  const zBeta = zFor(power);
  const rawPerArm = (2 * (zAlpha + zBeta) ** 2 * standardDeviation ** 2) / (meanDifference ** 2);
  const base = rawPerArm * (1 + 1 / allocation);
  const adjusted = adjustment(base, nonResponse, undefined, designEffect);
  return {
    value: adjusted,
    base: Math.ceil(base),
    nonResponse: nonResponse > 0 && nonResponse < 100 ? Math.ceil(base / (1 - nonResponse / 100)) : null,
    formula: "n_per arm ≈ 2(zα+zβ)²σ² / Δ²",
    variables: { zα: "confidence critical value", zβ: "power critical value", σ: "common or pooled standard deviation", Δ: "clinically meaningful mean difference", r: "allocation ratio" },
    steps: [`zα = ${zAlpha}`, `zβ = ${zBeta}`, `σ = ${standardDeviation}`, `Δ = ${meanDifference}`, `Approximate per-arm n = ${rawPerArm.toFixed(3)}`, `Base total = ${base.toFixed(3)}`],
    interpretation: `Plan for approximately ${adjusted ?? "an indeterminate"} participants across both groups.`,
    assumptions: ["Independent normally distributed outcomes.", "Equal or appropriately modeled variances.", "A common standard deviation is estimated reliably.", "Consult a statistician for repeated measures, longitudinal or cluster trials."],
  };
}

function invalid(message: string): SampleSizeResult {
  return { value: null, base: null, nonResponse: null, formula: "Not calculated", variables: {}, steps: [message], interpretation: "Result unavailable until valid inputs are provided.", assumptions: ["Check units and assumptions before using the result."] };
}
