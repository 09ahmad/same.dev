// Landing page for AI Website Creator. Users enter a prompt to generate a workspace for building a website.
// TODO: Implement /workspace page to handle prompt, show steps on the left and file explorer on the right.
"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home(){
  // Builder component for AI website generation
  const [prompt, setPrompt] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsBuilding(true);
    // TODO: Implement actual building logic
    router.push(`/workspace?prompt=${encodeURIComponent(prompt)}`)
    setTimeout(() => {
      setIsBuilding(false);
    }, 3000);
  };

  const examples = [
    "Build a modern portfolio website with dark theme",
    "Create an e-commerce site for handmade jewelry",
    "Design a landing page for a SaaS product",
    "Build a blog with minimal design"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Website Builder
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
              Describe Your Vision
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Tell our AI what kind of website you want to build, and watch it come to life in seconds.
            </p>
          </div>

          {/* Prompt Input Form */}
          <Card className="mb-8 shadow-glow border-primary/20">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-3">
                    Describe your website
                  </label>
                   <div className="relative">
                     <Textarea
                       id="prompt"
                       placeholder="E.g., Create a modern portfolio website with a dark theme, hero section, about page, and contact form..."
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       className="min-h-[140px] resize-none text-base border-2 border-primary/20 focus:border-primary/40 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-4 shadow-sm focus:shadow-glow transition-all duration-200 placeholder:text-muted-foreground/60"
                     />
                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                   </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!prompt.trim() || isBuilding}
                    className="bg-gradient-primary hover:opacity-90 text-black px-8"
                  >
                    {isBuilding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Building...
                      </>
                    ) : (
                      <>
                        Start Building
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Example Prompts */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold mb-4">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow border-border/50 hover:border-primary/30"
                  onClick={() => setPrompt(example)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
