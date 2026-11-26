export type NumericResult = {
  value: number | null;
  formula: string;
  steps: string[];
  interpretation: string;
  assumptions: string[];
};

export function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function mean(values: number[]): NumericResult {
  if (!values.length || values.some((v) => !finiteNumber(v))) {
    return invalidResult("At least one finite numeric value is required.");
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  const value = total / values.length;
  return {
    value,
    formula: "Mean = sum(x) / n",
    steps: [`sum(x) = ${total}`, `n = ${values.length}`, `Mean = ${total} / ${values.length} = ${value}`],
    interpretation: `The arithmetic average is ${value}.`,
    assumptions: ["Values are numeric.", "The mean is sensitive to extreme values."],
  };
}

export function median(values: number[]): NumericResult {
  if (!values.length || values.some((v) => !finiteNumber(v))) {
    return invalidResult("At least one finite numeric value is required.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    value,
    formula: "Median = middle ordered value (average of the two middle values when n is even)",
    steps: [`Ordered values: ${sorted.join(", ")}`, `n = ${sorted.length}`, `Median = ${value}`],
    interpretation: `The 50th percentile is ${value}.`,
    assumptions: ["Values are numeric.", "The median is less affected by extreme values than the mean."],
  };
}

export function mode(values: number[]): NumericResult {
  if (!values.length || values.some((v) => !finiteNumber(v))) {
    return invalidResult("At least one finite numeric value is required.");
  }
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const maximum = Math.max(...counts.values());
  if (maximum === 1) {
    return {
      value: null,
      formula: "Mode = value with the highest frequency",
      steps: ["No value occurs more than once.", "This dataset has no unique mode."],
      interpretation: "No mode was identified.",
      assumptions: ["Discrete or repeated values are required for a meaningful mode."],
    };
  }
  const modes = [...counts.entries()].filter(([, count]) => count === maximum).map(([value]) => value);
  const value = modes.length === 1 ? modes[0] : null;
  return {
    value,
    formula: "Mode = value with the highest frequency",
    steps: [`Highest frequency: ${maximum}`, `Mode(s): ${modes.join(", ")}`],
    interpretation: modes.length === 1 ? `The mode is ${modes[0]}, occurring ${maximum} times.` : `The dataset is multimodal: ${modes.join(", ")}.`,
    assumptions: ["All values are numeric.", "For continuous data, modes may be uninformative without grouping."],
  };
}

export function rangeAndIQR(values: number[]) {
  if (!values.length || values.some((v) => !finiteNumber(v))) {
    return { range: invalidResult("At least one finite numeric value is required."), iqr: invalidResult("At least one finite numeric value is required.") };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const quartile = (q: number) => {
    const position = (sorted.length - 1) * q;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  };
  const q1 = quartile(0.25);
  const q3 = quartile(0.75);
  const range = sorted[sorted.length - 1] - sorted[0];
  const iqr = q3 - q1;
  return {
    range: {
      value: range,
      formula: "Range = maximum - minimum",
      steps: [`Minimum = ${sorted[0]}`, `Maximum = ${sorted[sorted.length - 1]}`, `Range = ${range}`],
      interpretation: `The range is ${range}.`,
      assumptions: ["Range is highly sensitive to extreme values."],
    } as NumericResult,
    iqr: {
      value: iqr,
      formula: "IQR = Q3 - Q1",
      steps: [`Q1 = ${q1}`, `Q3 = ${q3}`, `IQR = ${q3} - ${q1} = ${iqr}`],
      interpretation: `The middle 50% of values span ${iqr} units.`,
      assumptions: ["Uses the linear percentile convention.", "Quartile conventions may differ between software."],
    } as NumericResult,
  };
}

export function varianceAndSD(values: number[]) {
  if (!values.length || values.some((v) => !finiteNumber(v))) {
    const invalid = invalidResult("At least one finite numeric value is required.");
    return { variance: invalid, standardDeviation: invalid };
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sumSquares = values.reduce((sum, value) => sum + (value - avg) ** 2, 0);
  if (values.length < 2) {
    const invalid = invalidResult("At least two observations are required for sample variance and standard deviation.");
    return { variance: invalid, standardDeviation: invalid };
  }
  const variance = sumSquares / (values.length - 1);
  const sd = Math.sqrt(variance);
  return {
    variance: {
      value: variance,
      formula: "Sample variance = sum((x - mean)^2) / (n - 1)",
      steps: [`Mean = ${avg}`, `sum of squared deviations = ${sumSquares}`, `Variance = ${sumSquares} / (${values.length} - 1) = ${variance}`],
      interpretation: `The sample variance is ${variance}.`,
      assumptions: ["Observations are approximately independent.", "This is sample variance, not population variance."],
    },
    standardDeviation: {
      value: sd,
      formula: "Sample SD = sqrt(sum((x - mean)^2) / (n - 1))",
      steps: [`Variance = ${variance}`, `SD = sqrt(${variance}) = ${sd}`],
      interpretation: `The sample standard deviation is ${sd} units.`,
      assumptions: ["SD is sensitive to outliers.", "Independence and representative sampling are required for inference."],
    },
  };
}

export function proportion(count: number, total: number): NumericResult {
  if (!finiteNumber(count) || !finiteNumber(total) || count < 0 || total <= 0 || count > total) {
    return invalidResult("Count must be from 0 to total, and total must be greater than 0.");
  }
  const value = count / total;
  return {
    value,
    formula: "Proportion = count / total",
    steps: [`Count = ${count}`, `Total = ${total}`, `Proportion = ${count} / ${total} = ${value}`],
    interpretation: `${(value * 100).toFixed(2)}% of the denominator (${count} of ${total}).`,
    assumptions: ["The numerator is included in the denominator.", "The denominator represents the population or sample of interest."],
  };
}

export function incidence(cases: number, personTime: number): NumericResult {
  if (!finiteNumber(cases) || !finiteNumber(personTime) || cases < 0 || personTime <= 0) {
    return invalidResult("Cases must be non-negative and person-time must be greater than 0.");
  }
  const value = cases / personTime;
  return {
    value,
    formula: "Incidence rate = new cases / person-time",
    steps: [`New cases = ${cases}`, `Person-time = ${personTime}`, `Rate = ${cases} / ${personTime} = ${value}`],
    interpretation: `${value} new cases per person-time unit; for 1,000 units, the rate is ${(value * 1000).toFixed(2)} per 1,000.`,
    assumptions: ["Person-time units must be defined.", "Cases are newly occurring and duplicate counting is avoided."],
  };
}

export function prevalence(cases: number, population: number): NumericResult {
  if (!finiteNumber(cases) || !finiteNumber(population) || cases < 0 || population <= 0 || cases > population) {
    return invalidResult("Cases must be from 0 to population, and population must be greater than 0.");
  }
  const value = cases / population;
  return {
    value,
    formula: "Prevalence = existing cases / population",
    steps: [`Existing cases = ${cases}`, `Population = ${population}`, `Prevalence = ${cases} / ${population} = ${value}`],
    interpretation: `${(value * 100).toFixed(2)}% (${cases} of ${population}).`,
    assumptions: ["Population is at risk and consistently defined.", "Prevalence is a point or period measure depending on the source."],
  };
}

export function confidenceIntervalForProportion(count: number, total: number, confidence = 0.95): NumericResult {
  const p = count / total;
  if (!finiteNumber(count) || !finiteNumber(total) || total <= 0 || count < 0 || count > total || confidence <= 0 || confidence >= 1) {
    return invalidResult("Use 0 <= count <= total, total > 0, and confidence between 0 and 1.");
  }
  const z = zCritical(confidence);
  const margin = z * Math.sqrt((p * (1 - p)) / total);
  const low = Math.max(0, p - margin);
  const high = Math.min(1, p + margin);
  return {
    value: p,
    formula: "p ± z × sqrt(p(1-p)/n)",
    steps: [`p = ${count}/${total} = ${p}`, `z = ${z}`, `SE = sqrt(${p}(1-${p})/${total})`, `Margin = ${margin}`, `Interval = [${low}, ${high}]`],
    interpretation: `The estimated proportion is ${p}; the Wald interval is ${low} to ${high}.`,
    assumptions: ["Large-sample Wald interval.", "Random/representative sampling.", "Not reliable for very small counts or proportions near 0/1; use exact methods."],
  };
}

export function relativeRisk(a: number, b: number, c: number, d: number): NumericResult {
  if (![a, b, c, d].every((v) => finiteNumber(v) && v >= 0) || a + b <= 0 || c + d <= 0) {
    return invalidResult("All cells must be non-negative; both exposure groups need a positive total.");
  }
  const value = (a / (a + b)) / (c / (c + d));
  if (!Number.isFinite(value)) return invalidResult("The relative risk denominator is zero.");
  return {
    value,
    formula: "RR = (a/(a+b)) / (c/(c+d))",
    steps: [`Exposed risk = ${a}/(${a}+${b})`, `Unexposed risk = ${c}/(${c}+${d})`, `RR = ${value}`],
    interpretation: value === 1 ? "Risk is approximately the same in both groups." : `Risk is ${value.toFixed(3)} times as high in the exposed group relative to the reference group.`,
    assumptions: ["Use only when risks are interpretable prospectively.", "Both denominator totals must be positive.", "Confounding may remain."],
  };
}

export function oddsRatio(a: number, b: number, c: number, d: number): NumericResult {
  if (![a, b, c, d].every((v) => finiteNumber(v) && v >= 0) || b <= 0 || c <= 0) {
    return invalidResult("All cells must be non-negative and b and c must be positive.");
  }
  const value = (a * d) / (b * c);
  return {
    value,
    formula: "OR = (a × d) / (b × c)",
    steps: [`a×d = ${a * d}`, `b×c = ${b * c}`, `OR = ${value}`],
    interpretation: value === 1 ? "The odds are approximately equal." : `The odds in the exposure/disease group are ${value.toFixed(3)} times the reference odds.`,
    assumptions: ["Case-control studies may report odds ratios but should not interpret them as risk ratios without a rare-disease assumption.", "Zero cells may require continuity correction."],
  };
}

export function absoluteRiskAndNNT(a: number, b: number, c: number, d: number) {
  if (![a, b, c, d].every((v) => finiteNumber(v) && v >= 0) || a + b <= 0 || c + d <= 0) {
    const invalid = invalidResult("All cells must be non-negative; both treatment groups need a positive total.");
    return { arr: invalid, nnt: invalid };
  }
  const treated = a / (a + b);
  const control = c / (c + d);
  const arr = control - treated;
  const nnt = arr !== 0 ? 1 / arr : null;
  return {
    arr: {
      value: arr,
      formula: "ARR = control event rate - treatment event rate",
      steps: [`Control risk = ${control}`, `Treatment risk = ${treated}`, `ARR = ${control} - ${treated} = ${arr}`],
      interpretation: arr >= 0 ? `Absolute risk is reduced by ${(arr * 100).toFixed(2)} percentage points.` : `Absolute risk is increased by ${Math.abs(arr * 100).toFixed(2)} percentage points.`,
      assumptions: ["ARR depends on baseline risk and follow-up period.", "Avoid NNT when the result is imprecise or ARR is near zero."],
    },
    nnt: nnt === null ? invalidResult("ARR is zero, so NNT is undefined.") : {
      value: nnt,
      formula: "NNT = 1 / ARR",
      steps: [`ARR = ${arr}`, `NNT = 1 / ${arr} = ${nnt}`],
      interpretation: `Approximately ${Math.ceil(nnt)} people would need treatment to prevent one additional event, assuming this ARR applies.`,
      assumptions: ["NNT is derived from ARR.", "Report confidence intervals and the follow-up period.", "Use absolute benefit terminology rather than causal certainty alone."],
    },
  };
}

export function diagnosticAccuracy(a: number, b: number, c: number, d: number) {
  // a=TP, b=FP, c=FN, d=TN
  if (![a, b, c, d].every((v) => finiteNumber(v) && v >= 0)) {
    const invalid = invalidResult("All four diagnostic counts must be non-negative.");
    return { sensitivity: invalid, specificity: invalid, ppv: invalid, npv: invalid };
  }
  const make = (numerator: number, denominator: number, name: string, formula: string, interpretation: string) => {
    if (denominator <= 0) return invalidResult(`${name} requires a positive reference category total.`);
    const value = numerator / denominator;
    return {
      value,
      formula,
      steps: [`Numerator = ${numerator}`, `Denominator = ${denominator}`, `${name} = ${numerator}/${denominator} = ${value}`],
      interpretation,
      assumptions: ["Counts describe the same verification population.", "Accuracy depends on disease prevalence for PPV and NPV."],
    } as NumericResult;
  };
  return {
    sensitivity: make(a, a + c, "Sensitivity", "Sensitivity = TP / (TP + FN)", `Sensitivity is ${(a / (a + c) * 100).toFixed(2)}%, given TP=${a} and FN=${c}.`),
    specificity: make(d, b + d, "Specificity", "Specificity = TN / (TN + FP)", `Specificity is ${(d / (b + d) * 100).toFixed(2)}%, given TN=${d} and FP=${b}.`),
    ppv: make(a, a + b, "PPV", "PPV = TP / (TP + FP)", `PPV is ${(a / (a + b) * 100).toFixed(2)}%, given TP=${a} and FP=${b}.`),
    npv: make(d, c + d, "NPV", "NPV = TN / (TN + FN)", `NPV is ${(d / (c + d) * 100).toFixed(2)}%, given TN=${d} and FN=${c}.`),
  };
}

export function chiSquare(a: number, b: number, c: number, d: number): NumericResult {
  if (![a, b, c, d].every((v) => finiteNumber(v) && v >= 0)) {
    return invalidResult("All four table cells must be non-negative.");
  }
  const n = a + b + c + d;
  if (n <= 0) return invalidResult("The total table count must be greater than 0.");
  const expectedA = ((a + b) * (a + c)) / n;
  const expectedB = ((a + b) * (b + d)) / n;
  const expectedC = ((c + d) * (a + c)) / n;
  const expectedD = ((c + d) * (b + d)) / n;
  const observed = [a, b, c, d];
  const expected = [expectedA, expectedB, expectedC, expectedD];
  if (expected.some((value) => value <= 0)) return invalidResult("Table marginals must be positive.");
  const value = observed.reduce((sum, cell, index) => sum + ((cell - expected[index]) ** 2) / expected[index], 0);
  const warning = expected.some((value) => value < 5);
  return {
    value,
    formula: "χ² = Σ (observed - expected)² / expected",
    steps: [`Expected cells: ${expected.map((v) => v.toFixed(3)).join(", ")}`, `χ² = ${value.toFixed(6)}`],
    interpretation: `The Pearson chi-square statistic is ${value.toFixed(3)}. This statistic alone does not give a p-value or direction.`,
    assumptions: [`Independent observations are required.`, warning ? "One or more expected cells is below 5; consider Fisher's exact test for a 2×2 table." : "No expected 2×2 cell is below 5."],
  };
}

export function correlation(xs: number[], ys: number[]): NumericResult {
  if (xs.length !== ys.length || xs.length < 2 || xs.some((v) => !finiteNumber(v)) || ys.some((v) => !finiteNumber(v))) {
    return invalidResult("Provide at least two paired numeric observations with equal lengths.");
  }
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let xSquares = 0;
  let ySquares = 0;
  xs.forEach((x, index) => {
    const dx = x - xMean;
    const dy = ys[index] - yMean;
    numerator += dx * dy;
    xSquares += dx * dx;
    ySquares += dy * dy;
  });
  if (xSquares === 0 || ySquares === 0) return invalidResult("Correlation is undefined because x or y is constant.");
  const value = numerator / Math.sqrt(xSquares * ySquares);
  const strength = Math.abs(value) >= 0.7 ? "strong" : Math.abs(value) >= 0.4 ? "moderate" : "weak";
  const direction = value >= 0 ? "positive" : "negative";
  return {
    value,
    formula: "r = Σ((x-x̄)(y-ȳ)) / sqrt(Σ(x-x̄)² Σ(y-ȳ)²)",
    steps: [`n = ${xs.length}`, `x̄ = ${xMean}`, `ȳ = ${yMean}`, `Pearson r = ${value}`],
    interpretation: `The Pearson correlation is ${value.toFixed(3)}, indicating a ${strength} ${direction} linear relationship.`,
    assumptions: ["Linear relationship, independent pairs, and no major outliers.", "Correlation does not imply causation.", "Pearson correlation is not appropriate for nonlinear or ordinal misuse."],
  };
}

export function zCritical(confidence: number): number {
  const table: Record<string, number> = { "0.8": 1.282, "0.85": 1.44, "0.9": 1.645, "0.95": 1.96, "0.99": 2.576 };
  return table[confidence.toFixed(2)] || 1.96;
}

function invalidResult(message: string): NumericResult {
  return {
    value: null,
    formula: "Not calculated",
    steps: [message],
    interpretation: "Result unavailable until valid inputs are provided.",
    assumptions: ["Check units, counts and denominators before interpreting."],
  };
}
