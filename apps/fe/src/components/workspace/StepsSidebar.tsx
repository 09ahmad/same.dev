import { Button } from '@/components/ui/button';
import { Step } from '@/lib/types';
import React from 'react';

export function StepsSidebar({ steps, currentStep, setCurrentStep, children }: {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (idx: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <aside className="w-full md:w-1/4 bg-card border-r border-border p-6 flex flex-col gap-4 relative min-w-[260px] max-w-xs">
      <h2 className="text-lg font-semibold mb-2">Steps</h2>
      <ol className="space-y-2 mb-8">
        {steps.map((step, idx) => (
          <li key={`${step.id}-${idx}`}>
            <Button
              variant={currentStep === idx ? 'default' : 'outline'}
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