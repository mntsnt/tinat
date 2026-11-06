"use client";

import React from "react";
import { Check } from "lucide-react";

interface AuthStepperProps {
  currentStep: 1 | 2 | 3;
}

export function AuthStepper({ currentStep }: AuthStepperProps) {
  const steps = [
    { num: 1, label: "Account Details" },
    { num: 2, label: "Platform Agreement" },
    { num: 3, label: "Email Verification" },
  ];

  return (
    <div className="w-full pb-3 mb-1">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {steps.map((step, idx) => {
          const isDone = step.num < currentStep;
          const isCurrent = step.num === currentStep;

          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-xs"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.num}
                </div>
                <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    isCurrent
                      ? "text-foreground font-semibold"
                      : isDone
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-colors ${
                    step.num < currentStep ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
