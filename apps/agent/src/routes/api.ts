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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

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
router.post("/clone-template", async (req, res) => {
  const { url, prompt: userPrompt } = req.body;
  
  try {
    // Step 1: Determine template based on user input
    const template = await determineTemplate(userPrompt || "");
    const templatePrompt = getTemplatePrompt(template);
    
    let finalPrompt = "";
    let scrapedData = null;
    let imageLinks:any = []; // New: To store all image links
    
    // Step 2: Handle scraping if URL is provided
    if (url) {
      await cleanupOldFiles();
      const { jsonPath, screenshots } = await scrapeAllPages(url);
      const scrapedJson = await fs.readFile(jsonPath, "utf-8");
      scrapedData = JSON.parse(scrapedJson);
      
      // Collect all unique image links
      imageLinks = scrapedData.reduce((acc:any, page:any) => {
        if (page.images && page.images.length) {
          return [...acc, ...page.images];
        }
        return acc;
      }, []);
      
      // Remove duplicates
      imageLinks = [...new Set(imageLinks)];
      
      // Check if scraped data is too large
      if (scrapedData.length > 10) {
        console.warn(`Large website detected: ${scrapedData.length} pages. Limiting to first 10 pages for token efficiency.`);
        scrapedData = scrapedData.slice(0, 10);
      }
      
      finalPrompt = buildScrapedPrompt(url, scrapedData, []);
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
        finalPrompt
      ];
      uiPrompts = [reactBasePrompt];
    } else if (template === "next") {
      prompts = [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nextBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        finalPrompt
      ];
      uiPrompts = [nextBasePrompt];
    }
    
    res.json({
      prompts: prompts,
      uiPrompts: uiPrompts,
      template: template,
      scrapedData: {
        url,
        pageCount: scrapedData ? scrapedData.length : 0,
        imageLinks, // Include all image links in response
        pages: scrapedData ? scrapedData.map((page:any) => ({
          url: page.url,
          images: page.images,
          dynamicContent: page.dynamicContent
        })) : []
      }
    });
    
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Clone website error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/clone-chat", async (req, res) => {
    try {
        const {
            prompts,
            uiPrompts,
            template,
            scrapedData
        } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        // Convert messages format for Gemini using system prompt
        let conversationText = getSystemPrompt() + "\n\n";
        
        // Add the website clone context first
        conversationText += "Website Clone Project Context:\n";
        conversationText += `- Template: ${template}\n`;
        conversationText += `- Original URL: ${scrapedData.url}\n`;
        conversationText += `- Pages to clone: ${scrapedData.pages.length}\n\n`;
        
        // Add all prompts as user messages
        prompts.forEach((prompt: string) => {
            conversationText += `User: ${prompt}\n\n`;
        });
        
        // Add UI prompts as system messages
        uiPrompts.forEach((uiPrompt: string) => {
            conversationText += `System: UI Configuration - ${uiPrompt}\n\n`;
        });
        
        // Add scraped data summary
        conversationText += "System: Scraped Data Summary:\n";
        if (scrapedData.imageLinks.length > 0) {
            conversationText += `- Key Images: ${scrapedData.imageLinks.slice(0, 5).join(', ')}\n`;
        }
        if (scrapedData.pages.length > 0) {
            scrapedData.pages.slice(0, 3).forEach((page: any, index: number) => {
                conversationText += `- Page ${index + 1}: ${page.url} (${page.images?.length || 0} images)\n`;
            });
        }
        conversationText += "\n";
        
        // Final instruction
        conversationText += "User: Generate complete code implementation for this website clone using the specified template. " +
                          "Include all necessary files and ensure production-ready quality. " +
                          "Respond with a properly formatted <boltArtifact> containing the full implementation.\n\n";
        
        conversationText += "Assistant: ";

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [{ text: conversationText }] 
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
        });

        const response = await result.response;
        const generatedText = response.text();

        // Parse the response for files if in boltArtifact format
        let files:any = [];
        const artifactMatch = generatedText.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);
        if (artifactMatch) {
            const artifactContent:any = artifactMatch[1];
            const fileMatches = [...artifactContent.matchAll(/<boltAction[^>]*filePath="([^"]*)"[^>]*>([\s\S]*?)<\/boltAction>/g)];
            
            files = fileMatches.map(match => ({
                path: match[1],
                content: match[2].trim()
            }));
        }

        res.json({
            success: true,
            response: generatedText,
            files: files.length > 0 ? files : undefined,
            metadata: {
                template,
                originalUrl: scrapedData.url,
                imageCount: scrapedData.imageLinks.length,
                pageCount: scrapedData.pages.length
            }
        });

    } catch (error) {
        console.error("Error in /generate-code:", error);
        res.status(500).json({ 
            success: false,
            message: "Failed to generate code",
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;