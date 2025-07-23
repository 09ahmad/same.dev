import { Router } from "express";
import { scrapeAllPages, cleanupOldFiles } from "../scrape.js";
import { buildScrapedPrompt, getSystemPrompt, BASE_PROMPT } from "../prompts.js";
import { basePrompt as nodeBasePrompt } from "../default/node.js";
import { basePrompt as reactBasePrompt } from "../default/react.js";
import { basePrompt as nextBasePrompt } from "../default/next.js";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to call Gemini API
async function callGemini(messages: { role: string; content: string }[], temperature = 0) {
  try {
    // Convert messages to Gemini format
    let prompt = "";
    
    // Handle system messages and user messages
    const systemMessages = messages.filter(m => m.role === "system");
    const userMessages = messages.filter(m => m.role === "user");
    
    // Combine system messages as context
    if (systemMessages.length > 0) {
      prompt += systemMessages.map(m => m.content).join("\n\n") + "\n\n";
    }
    
    // Add user messages
    if (userMessages.length > 0) {
      prompt += userMessages.map(m => m.content).join("\n\n");
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 8192,
      },
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

router.post("/template", async (req, res) => {
    try {
        const prompt = req.body.prompt;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const systemInstruction = "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";
        
        const fullPrompt = `${systemInstruction}\n\nUser request: ${prompt}`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const answer = response.text().toLowerCase().trim();
        
        if (answer === "react") {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }
        
        if (answer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }
        
        res.status(403).json({ message: "You can't access this" });
    } catch (error) {
        console.error("Error in /template:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/chat", async (req, res) => {
    try {
        const messages = req.body.messages;
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Convert messages format for Gemini
        // Gemini expects a single prompt, so we need to format the conversation
        let conversationText = getSystemPrompt() + "\n\n";
        
        messages.forEach((message: { role: string; content: string }) => {
            if (message.role === 'user') {
                conversationText += `Human: ${message.content}\n\n`;
            } else if (message.role === 'assistant') {
                conversationText += `Assistant: ${message.content}\n\n`;
            }
        });
        
        // Add final prompt for the assistant to respond
        conversationText += "Assistant: ";
        
        const result = await model.generateContent(conversationText);
        const response = await result.response;
        
        res.json({
            response: response.text()
        });
    } catch (error) {
        console.error("Error in /chat:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Get available templates
router.get("/templates", (req, res) => {
  res.json({
    templates: [
      {
        id: "react",
        name: "React",
        description: "Modern React application with TypeScript, Vite, and Tailwind CSS",
        default: true
      },
      {
        id: "next",
        name: "Next.js",
        description: "Full-stack Next.js application with App Router and modern UI components"
      }
    ]
  });
}); 

// Helper function to determine template from user input
async function determineTemplate(userInput: string): Promise<string> {
  if (!userInput) return "react"; // Default to React if no input
  
  try {
    const response = await callGemini([
      { 
        role: "user", 
        content: `Based on this user request, determine if they want React or Next.js. Only return 'react' or 'next'. User request: ${userInput}` 
      },
      {
        role: "system",
        content: "Return either 'react' or 'next' based on the user's request. If they mention Next.js, return 'next'. Otherwise, return 'react' as default. Only return a single word."
      },
    ]);
    
    const answer = response.trim().toLowerCase();
    return answer === "next" ? "next" : "react"; // Default to React
  } catch (error) {
    console.error("Error determining template:", error);
    return "react"; // Default fallback
  }
}

// Helper function to get template prompt
function getTemplatePrompt(template: string): string {
  switch (template) {
    case "next":
      return nextBasePrompt;
    case "react":
    default:
      return reactBasePrompt;
  }
}

router.post("/clone-website", async (req, res) => {
  const { url, prompt: userPrompt } = req.body;
  
  try {
    // Step 1: Determine template based on user input
    const template = await determineTemplate(userPrompt || "");
    const templatePrompt = getTemplatePrompt(template);
    
    let finalPrompt = "";
    let scrapedData = null;
    
    // Step 2: Handle scraping if URL is provided
    if (url) {
      await cleanupOldFiles();
      const { jsonPath, screenshots } = await scrapeAllPages(url);
      const scrapedJson = await fs.readFile(jsonPath, "utf-8");
      scrapedData = JSON.parse(scrapedJson);
      
      // Check if scraped data is too large
      if (scrapedData.length > 10) {
        console.warn(`Large website detected: ${scrapedData.length} pages. Limiting to first 10 pages for token efficiency.`);
        scrapedData = scrapedData.slice(0, 10);
      }
      
      // Skip screenshot processing to save tokens - base64 data is too large
      const screenshotBase64s: string[] = [];
      
      // Add more context about the website being cloned
      console.log(`Cloning website: ${url}`);
      console.log(`Pages found: ${scrapedData.length}`);
      scrapedData.forEach((page: any, index: number) => {
        console.log(`Page ${index + 1}: ${page.url} (${page.images?.length || 0} images)`);
      });
      
      finalPrompt = buildScrapedPrompt(url, scrapedData, screenshotBase64s);
    } else if (userPrompt) {
      finalPrompt = userPrompt;
    } else {
      res.status(400).json({ error: "Missing url or prompt" });
      return;
    }
    
    // Step 3: Follow the same pattern as template API
    let prompts: string[] = [];
    let uiPrompts: string[] = [];
    
    if (template === "react") {
      prompts = [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        finalPrompt // Add the scraping prompt here
      ];
      uiPrompts = [reactBasePrompt];
    } else if (template === "next") {
      prompts = [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nextBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        finalPrompt // Add the scraping prompt here
      ];
      uiPrompts = [nextBasePrompt];
    }
    
    res.json({
      prompts: prompts,
      uiPrompts: uiPrompts,
      template: template,
      scrapedData: scrapedData ? { url, pageCount: scrapedData.length } : null
    });
    
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Clone website error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;