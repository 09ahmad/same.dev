import React from 'react';

export function LLMOutput({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex-1 mb-16">
      <div className="bg-muted/60 rounded-lg p-4 text-sm text-muted-foreground shadow-inner border border-border">
        <strong>Thoughts</strong>
        <div className="mt-2">I'll create a beautiful and fully-featured todo app with modern design and smooth interactions. This will be a production-ready application with all the essential features users expect.</div>
      </div>
      {children}
    </div>
  );
} 