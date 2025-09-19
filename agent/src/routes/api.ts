import express from "express";
import {
  getSystemPrompt,
  BASE_PROMPT,
} from "../prompts.js";
import { basePrompt as nodeBasePrompt } from "../default/node.js";
import { basePrompt as reactBasePrompt } from "../default/react.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

router.post("/template", async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction =
      "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";

    const fullPrompt = `${systemInstruction}\n\nUser request: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const answer = response.text().toLowerCase().trim();

    if (answer === "react") {
      res.json({
        prompts: [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [reactBasePrompt],
      });
      return;
    }

    if (answer === "node") {
      res.json({
        prompts: [
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        uiPrompts: [nodeBasePrompt],
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

    let conversationText = getSystemPrompt() + "\n\n";

    messages.forEach((message: { role: string; content: string }) => {
      if (message.role === "user") {
        conversationText += `Human: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        conversationText += `Assistant: ${message.content}\n\n`;
      }
    });

    conversationText += "Assistant: ";

    const result = await model.generateContent(conversationText);
    const response = await result.response;

    res.json({
      response: response.text(),
    });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/templates", (req, res) => {
  res.json({
    templates: [
      {
        id: "react",
        name: "React",
        description:
          "Modern React application with TypeScript, Vite, and Tailwind CSS",
        default: true,
      },
      {
        id: "next",
        name: "Next.js",
        description:
          "Full-stack Next.js application with App Router and modern UI components",
      },
    ],
  });
});

export default router;
