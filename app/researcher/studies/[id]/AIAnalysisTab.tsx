"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Sparkles } from "lucide-react";

export function AIAnalysisTab({ studyId, responsesCount }: { studyId: string, responsesCount: number }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Mocking an AI delay
    await new Promise((r) => setTimeout(r, 2000));
    setResult("Based on the responses, the majority of participants show a strong correlation between remote work flexibility and overall job satisfaction. Participants working from home 3+ days a week reported 24% higher well-being scores. Key anomaly: Participants in the 18-24 age group reported lower satisfaction with remote onboarding processes.");
    setAnalyzing(false);
  };

  if (responsesCount < 5) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Insufficient Data for AI Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Collect at least 5 responses to generate AI-driven insights and pattern recognition.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insight Generator
        </CardTitle>
        <CardDescription>Use AI to automatically identify trends, anomalies, and correlations in your dataset.</CardDescription>
      </CardHeader>
      <CardContent>
        {!result ? (
          <Button onClick={handleAnalyze} isLoading={analyzing} className="gap-2">
            {!analyzing && <Sparkles className="h-4 w-4" />}
            {analyzing ? "Analyzing Dataset..." : "Generate Insights"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border border-border leading-relaxed text-sm text-foreground">
              {result}
            </div>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>Reset Analysis</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
