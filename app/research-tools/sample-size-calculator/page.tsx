"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { singleMean, singleProportion, twoMeans, twoProportions } from "@/lib/sampleSize";

type Method = "single-proportion" | "single-mean" | "two-proportions" | "two-means";

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold">{label}</span><Input type="number" value={value} onChange={(event) => onChange(event.target.value)} /><span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span></label>;
}

export default function SampleSizeCalculatorPage() {
  const [method, setMethod] = useState<Method>("single-proportion");
  const [p, setP] = useState("0.5");
  const [p2, setP2] = useState("0.65");
  const [margin, setMargin] = useState("0.05");
  const [confidence, setConfidence] = useState("95");
  const [power, setPower] = useState("80");
  const [standardDeviation, setStandardDeviation] = useState("10");
  const [meanDifference, setMeanDifference] = useState("5");
  const [population, setPopulation] = useState("");
  const [nonResponse, setNonResponse] = useState("10");
  const [designEffect, setDesignEffect] = useState("1");
  const [allocation, setAllocation] = useState("1");
  const [result, setResult] = useState<ReturnType<typeof singleProportion> | null>(null);
  const [error, setError] = useState("");

  function n(value: string) { const parsed = Number(value); if (!value.trim() || !Number.isFinite(parsed)) throw new Error("Please enter a valid number."); return parsed; }

  function calculate() {
    setError("");
    try {
      const conf = n(confidence) / 100;
      const pow = n(power) / 100;
      const pop = population.trim() ? n(population) : undefined;
      const nr = n(nonResponse);
      const deff = n(designEffect);
      const alloc = n(allocation);
      let next;
      if (method === "single-proportion") next = singleProportion(n(p), n(margin), conf, pop, nr, deff);
      if (method === "single-mean") next = singleMean(0, n(standardDeviation), n(margin), conf, pop, nr, deff);
      if (method === "two-proportions") next = twoProportions(n(p), n(p2), pow, conf, alloc, nr, deff);
      if (method === "two-means") next = twoMeans(n(meanDifference), n(standardDeviation), pow, conf, alloc, nr, deff);
      setResult(next || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to calculate.");
      setResult(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Research planning</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Sample Size Calculator</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Calculate planning estimates for common health research designs. These approximations require competent study assumptions; consult a statistician for cluster trials, repeated measures or complex designs.</p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Method</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {([
              ["single-proportion", "Single population proportion"],
              ["single-mean", "Single population mean"],
              ["two-proportions", "Comparison of two proportions"],
              ["two-means", "Comparison of two means"],
            ] as Array<[Method, string]>).map(([id, label]) => (
              <button key={id} type="button" onClick={() => { setMethod(id); setResult(null); setError(""); }} className={`w-full rounded-md px-3 py-2 text-left text-sm ${method === id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Parameters</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {(method === "single-proportion" || method === "two-proportions") && <Field label={method === "two-proportions" ? "Group 1 proportion (p1)" : "Expected proportion (p)"} value={p} onChange={setP} hint="Enter as decimal, for example 0.35." />}
                {method === "two-proportions" && <Field label="Group 2 proportion (p2)" value={p2} onChange={setP2} hint="Enter as decimal." />}
                {method === "single-proportion" && <Field label="Absolute margin (d)" value={margin} onChange={setMargin} hint="Decimal proportion, for example 0.05." />}
                {method === "single-mean" && <Field label="Standard deviation (σ)" value={standardDeviation} onChange={setStandardDeviation} hint="Use the outcome unit." />}
                {method === "single-mean" && <Field label="Absolute margin (d)" value={margin} onChange={setMargin} hint="Desired precision in outcome units." />}
                {method === "two-means" && <Field label="Clinically meaningful difference (Δ)" value={meanDifference} onChange={setMeanDifference} hint="Difference in mean outcome units." />}
                {method === "two-means" && <Field label="Common standard deviation (σ)" value={standardDeviation} onChange={setStandardDeviation} hint="Pooled estimate." />}
                <Field label="Confidence (%)" value={confidence} onChange={setConfidence} hint="Usually 95%." />
                {(method === "two-proportions" || method === "two-means") && <Field label="Power (%)" value={power} onChange={setPower} hint="Usually 80% or 90%." />}
                {(method === "two-proportions" || method === "two-means") && <Field label="Allocation ratio" value={allocation} onChange={setAllocation} hint="1:1 is 1. Unequal arms use > or < 1." />}
                {(method === "single-proportion" || method === "single-mean") && <Field label="Finite population size (optional)" value={population} onChange={setPopulation} hint="Leave blank when population is effectively unlimited." />}
                <Field label="Anticipated non-response (%)" value={nonResponse} onChange={setNonResponse} hint="For example 10 for 10%." />
                <Field label="Design effect / DEFF" value={designEffect} onChange={setDesignEffect} hint="Use 1 for simple random sampling." />
              </div>
              {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={calculate}>Calculate sample size</Button>
                <Button variant="outline" onClick={() => { setP("0.5"); setP2("0.65"); setMargin("0.05"); setConfidence("95"); setPower("80"); setStandardDeviation("10"); setMeanDifference("5"); setPopulation(""); setNonResponse("10"); setDesignEffect("1"); setAllocation("1"); }}>Try example</Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader><CardTitle className="text-base">Calculated result</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Base sample</p><p className="mt-1 text-2xl font-bold">{result.base ?? "—"}</p></div>
                  <div className="rounded-md bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Non-response adjusted</p><p className="mt-1 text-2xl font-bold">{result.nonResponse ?? "Not applied"}</p></div>
                  <div className="rounded-md bg-primary/10 p-3"><p className="text-xs text-muted-foreground">Final planning size</p><p className="mt-1 text-2xl font-bold text-primary">{result.value ?? "—"}</p></div>
                </div>
                <p><strong>Formula:</strong> {result.formula}</p>
                <p><strong>Interpretation:</strong> {result.interpretation}</p>
                <div><strong>Variable definitions:</strong><ul className="mt-1 list-disc pl-5 text-muted-foreground">{Object.entries(result.variables).map(([name, definition]) => <li key={name}><strong>{name}:</strong> {definition}</li>)}</ul></div>
                <div><strong>Calculation steps:</strong><ul className="mt-1 list-disc pl-5 text-muted-foreground">{result.steps.map((step) => <li key={step}>{step}</li>)}</ul></div>
                <div><strong>Assumptions and limitations:</strong><ul className="mt-1 list-disc pl-5 text-muted-foreground">{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
