import { Button } from "@/components/ui/button";
import { Step } from "@/lib/types";
import React from "react";
import { useSearchParams } from "next/navigation";

export function StepsSidebar({
  steps,
  currentStep,
  setCurrentStep,
  children,
  loading,
}: {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (idx: number) => void;
  children?: React.ReactNode;
  loading: boolean;
}) {
  const searchParams = useSearchParams();
  const userInput = searchParams.get("prompt");

  const getTextSize = (text: string | null) => {
    if (!text) return "text-lg";
    const lines = Math.ceil(text.length / 25);
    if (lines <= 1) return "text-md font-medium text-sm ";
    if (lines <= 3) return "text-md font-medium text-sm ";
    return "text-sm";
  };

  if (loading) {
    return (
      <aside className="w-full md:w-1/4 bg-card border-r border-border p-6 flex flex-col gap-4 relative min-w-[260px] max-w-xs space-y-2">
        <div className="flex justify-start">
          <span
            className={`bg-muted/60 text-slate-200 font-medium text-sm px-3 py-2 flex items-center rounded-sm break-words hyphens-auto max-w-full ${getTextSize(userInput)}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
          >
            {userInput || "No input"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm font-medium">Thinking</span>
          <div className="flex space-x-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[blink_1s_ease-in-out_infinite]"></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[blink_1s_ease-in-out_infinite] [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[blink_1s_ease-in-out_infinite] [animation-delay:0.4s]"></span>
          </div>
        </div>
        <style jsx>{`
          @keyframes blink {
            0%,
            80%,
            100% {
              opacity: 0;
            }
            40% {
              opacity: 1;
            }
          }
        `}</style>

        {children}
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-1/4 bg-card border-r border-border p-6 flex flex-col gap-4 relative min-w-[260px] max-w-xs">
      <div className="flex justify-start">
        <span
          className={`bg-muted/60 text-slate-200 font-medium text-sm px-3 py-2 flex items-center rounded-sm break-words hyphens-auto max-w-full ${getTextSize(userInput)}`}
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {userInput || "No input"}
        </span>
      </div>
      <ol className="space-y-2 mb-8">
        {steps.map((step, idx) => (
          <li key={`${step.id}-${idx}`}>
            <Button
              variant={currentStep === idx ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setCurrentStep(idx)}
            >
              {idx + 1}. {step.title}
            </Button>
          </li>
        ))}
      </ol>
      {children}
    </aside>
  );
}