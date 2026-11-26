"use client";

import { useMemo, useState } from "react";
import {
  absoluteRiskAndNNT,
  chiSquare,
  confidenceIntervalForProportion,
  correlation,
  diagnosticAccuracy,
  incidence,
  mean,
  median,
  mode,
  oddsRatio,
  prevalence,
  proportion,
  rangeAndIQR,
  relativeRisk,
  varianceAndSD,
  type NumericResult,
} from "@/lib/statistics";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type Method =
  | "descriptive"
  | "proportion"
  | "incidence"
  | "prevalence"
  | "confidence"
  | "relative-risk"
  | "odds-ratio"
  | "arr-nnt"
  | "diagnostic"
  | "chi-square"
  | "correlation";

const methods: Array<{ id: Method; label: string }> = [
  { id: "descriptive", label: "Mean, median, mode and spread" },
  { id: "proportion", label: "Proportion and percentage" },
  { id: "incidence", label: "Incidence rate" },
  { id: "prevalence", label: "Prevalence" },
  { id: "confidence", label: "Proportion confidence interval" },
  { id: "relative-risk", label: "Relative risk" },
  { id: "odds-ratio", label: "Odds ratio" },
  { id: "arr-nnt", label: "ARR and NNT" },
  { id: "diagnostic", label: "Sensitivity, specificity and predictive values" },
  { id: "chi-square", label: "Chi-square 2×2 test" },
  { id: "correlation", label: "Pearson correlation" },
];

function useNumberState(defaultValue = "") {
  return useState(defaultValue);
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span>
      <Input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export default function StatisticalCalculatorPage() {
  const [method, setMethod] = useState<Method>("descriptive");
  const [dataset, setDataset] = useState("12, 18, 15, 18, 21, 24");
  const [count, setCount] = useNumberState("45");
  const [total, setTotal] = useNumberState("200");
  const [confidence, setConfidence] = useNumberState("95");
  const [personTime, setPersonTime] = useNumberState("1000");
  const [a, setA] = useNumberState("40");
  const [b, setB] = useNumberState("10");
  const [c, setC] = useNumberState("20");
  const [d, setD] = useNumberState("130");
  const [xs, setXs] = useState("1, 2, 3, 4, 5");
  const [ys, setYs] = useState("2, 4, 5, 4, 6");
  const [results, setResults] = useState<NumericResult[]>([]);
  const [error, setError] = useState("");

  const examples = useMemo(() => ({
    descriptive: "12, 18, 15, 18, 21, 24",
    proportion: "45, 200",
    incidence: "25, 1000",
    prevalence: "60, 800",
    confidence: "45, 200",
  }), []);

  function parseNumbers(text: string) {
    const values = text.split(/[\n,\s]+/).map((value) => value.trim()).filter(Boolean).map(Number);
    if (!values.length || values.some((value) => !Number.isFinite(value))) throw new Error("Provide a valid comma-separated numeric dataset.");
    return values;
  }

  function number(value: string, label: string) {
    const parsed = Number(value);
    if (!value.trim() || !Number.isFinite(parsed)) throw new Error(`${label} must be a finite number.`);
    return parsed;
  }

  function calculate() {
    setError("");
    try {
      let next: NumericResult[] = [];
      if (method === "descriptive") {
        const values = parseNumbers(dataset);
        const spread = rangeAndIQR(values);
        const variance = varianceAndSD(values);
        next = [mean(values), median(values), mode(values), spread.range, spread.iqr, variance.variance, variance.standardDeviation];
      } else if (method === "proportion") {
        next = [proportion(number(count, "Count"), number(total, "Total"))];
      } else if (method === "incidence") {
        next = [incidence(number(count, "Cases"), number(personTime, "Person-time"))];
      } else if (method === "prevalence") {
        next = [prevalence(number(count, "Cases"), number(total, "Population"))];
      } else if (method === "confidence") {
        const conf = number(confidence, "Confidence") / 100;
        next = [confidenceIntervalForProportion(number(count, "Count"), number(total, "Total"), conf)];
      } else if (method === "relative-risk") {
        next = [relativeRisk(number(a, "Exposed cases"), number(b, "Exposed non-cases"), number(c, "Reference cases"), number(d, "Reference non-cases"))];
      } else if (method === "odds-ratio") {
        next = [oddsRatio(number(a, "Exposed cases"), number(b, "Exposed non-cases"), number(c, "Reference cases"), number(d, "Reference non-cases"))];
      } else if (method === "arr-nnt") {
        const { arr, nnt } = absoluteRiskAndNNT(number(a, "Treatment events"), number(b, "Treatment non-events"), number(c, "Control events"), number(d, "Control non-events"));
        next = [arr, nnt];
      } else if (method === "diagnostic") {
        const diagnostic = diagnosticAccuracy(number(a, "True positives"), number(b, "False positives"), number(c, "False negatives"), number(d, "True negatives"));
        next = [diagnostic.sensitivity, diagnostic.specificity, diagnostic.ppv, diagnostic.npv];
      } else if (method === "chi-square") {
        next = [chiSquare(number(a, "Cell A"), number(b, "Cell B"), number(c, "Cell C"), number(d, "Cell D"))];
      } else if (method === "correlation") {
        next = [correlation(parseNumbers(xs), parseNumbers(ys))];
      }
      setResults(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to calculate.");
      setResults([]);
    }
  }

  function loadExample() {
    if (method === "descriptive") setDataset(examples.descriptive);
    if (method === "proportion") { setCount("45"); setTotal("200"); }
    if (method === "incidence") { setCount("25"); setPersonTime("1000"); }
    if (method === "prevalence") { setCount("60"); setTotal("800"); }
    if (method === "confidence") { setCount("45"); setTotal("200"); setConfidence("95"); }
    if (method === "relative-risk" || method === "odds-ratio" || method === "arr-nnt") { setA("40"); setB("10"); setC("20"); setD("130"); }
    if (method === "diagnostic") { setA("90"); setB("20"); setC("10"); setD("180"); }
    if (method === "chi-square") { setA("30"); setB("20"); setC("15"); setD("35"); }
    if (method === "correlation") { setXs("1, 2, 3, 4, 5"); setYs("2, 4, 5, 4, 6"); }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Research tool</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Statistical Calculator</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Perform common descriptive and epidemiologic calculations. Review assumptions and consult a statistician for study planning or publication analysis.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Calculation</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {methods.map((item) => (
              <button key={item.id} type="button" onClick={() => { setMethod(item.id); setResults([]); setError(""); }} className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${method === item.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
            <CardContent>
              {method === "descriptive" && (
                <label className="block"><span className="mb-1.5 block text-xs font-semibold">Numeric dataset</span><textarea value={dataset} onChange={(e) => setDataset(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="12, 18, 15, 18" /></label>
              )}
              {["proportion", "incidence", "prevalence", "confidence"].includes(method) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label={method === "incidence" ? "New cases" : "Count or cases"} value={count} onChange={setCount} />
                  {method === "incidence" ? <NumberField label="Person-time" value={personTime} onChange={setPersonTime} /> : <NumberField label={method === "prevalence" ? "Population" : "Total"} value={total} onChange={setTotal} />}
                  {method === "confidence" && <NumberField label="Confidence (%)" value={confidence} onChange={setConfidence} />}
                </div>
              )}
              {["relative-risk", "odds-ratio", "arr-nnt", "diagnostic", "chi-square"].includes(method) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label={method === "diagnostic" ? "True positives (a)" : method === "chi-square" ? "Cell A" : "Group 1 events / Treatment events"} value={a} onChange={setA} />
                  <NumberField label={method === "diagnostic" ? "False positives (b)" : method === "chi-square" ? "Cell B" : "Group 1 non-events"} value={b} onChange={setB} />
                  <NumberField label={method === "diagnostic" ? "False negatives (c)" : method === "chi-square" ? "Cell C" : "Group 2 events / Control events"} value={c} onChange={setC} />
                  <NumberField label={method === "diagnostic" ? "True negatives (d)" : method === "chi-square" ? "Cell D" : "Group 2 non-events"} value={d} onChange={setD} />
                </div>
              )}
              {method === "correlation" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold">X values</span><textarea value={xs} onChange={(e) => setXs(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold">Y values</span><textarea value={ys} onChange={(e) => setYs(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
                </div>
              )}
              {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={calculate}>Calculate</Button>
                <Button variant="outline" onClick={loadExample}>Try example</Button>
              </div>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={result.value === null ? "border-amber-500/40" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span>{["Mean", "Median", "Mode", "Range", "IQR", "Variance", "Standard deviation"][index] || "Result"}</span>
                      {result.value !== null && <span className="text-primary">{Number(result.value).toFixed(6).replace(/\.?0+$/, "")}</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Formula:</strong> {result.formula}</p>
                    <p><strong>Interpretation:</strong> {result.interpretation}</p>
                    <div><strong>Steps:</strong><ul className="mt-1 list-disc pl-5 text-muted-foreground">{result.steps.map((step) => <li key={step}>{step}</li>)}</ul></div>
                    <div><strong>Assumptions and limitations:</strong><ul className="mt-1 list-disc pl-5 text-muted-foreground">{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
