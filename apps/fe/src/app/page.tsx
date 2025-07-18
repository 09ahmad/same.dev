// Landing page for AI Website Creator. Users enter a prompt to generate a workspace for building a website.
// TODO: Implement /workspace page to handle prompt, show steps on the left and file explorer on the right.
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (prompt.trim()) {
      router.push(`/workspace?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md p-8 bg-card rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">AI Website Creator</h1>
        <h2 className="text-muted-foreground text-base mb-4">Describe your website idea and get a step-by-step workspace to build it.</h2>
        <Input
          placeholder="Describe your website idea..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
        <span className="text-xs text-muted-foreground">No sign up required. Instant workspace.</span>
        <Button type="submit" variant="default">Generate</Button>
      </form>
      <footer className="absolute bottom-2 left-0 w-full text-center text-xs text-muted-foreground">© {new Date().getFullYear()} AI Website Creator</footer>
    </div>
  )
}
