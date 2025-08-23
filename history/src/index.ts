import express, { Request, Response } from "express";
import cors from "cors";
import { prismaClient } from "@repo/db/client";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/user", async (req: Request, res: Response) => {
  try {
    const { username, fullName } = req.body;
    if (!username || !fullName) {
      return res.status(400).json({ error: "Missing field, Email and Name is required" });
    }

    const user = await prismaClient.user.create({
      data: {
        name: fullName,
        email: username
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

// Create new chat conversation
app.post("/api/conversation", async (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }

    const conversation = await prismaClient.conversation.create({
      data: {
        userId,
        title: title || "New conversation",
        type: "chat" // Explicitly set as chat type
      },
      include: {
        messages: true,
        _count: { select: { messages: true } },
      },
    });

    return res.status(201).json(conversation);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

// Add message to a conversation
app.post("/api/messages/:id", async (req: Request, res: Response) => {
  const { id: conversationId } = req.params;
  const { role, content } = req.body;

  if (!conversationId || !role || !content) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  const conversation = await prismaClient.conversation.findFirst({
    where: { id: conversationId }
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const message = await prismaClient.messages.create({
    data: {
      conversationId,
      role,
      content,
    },
  });

  if (!message) {
    return res.status(500).json({ error: "Some error occurred" });
  }

  return res.status(201).json(message);
});

// Get chat conversations for user
app.get("/api/history/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing required field" });
    }

    const conversations = await prismaClient.conversation.findMany({
      where: { 
        userId,
        type: "chat" // Only get chat conversations
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" }
    });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

// Create workspace conversation
app.post("/api/workspace/conversation", async (req: Request, res: Response) => {
  try {
    const { userId, title, prompt, template } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json({ error: "UserId and prompt are required" });
    }

    const conversation = await prismaClient.conversation.create({
      data: {
        userId,
        title: title || prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        prompt, // Store original prompt
        template, // Store template type (react/node)
        type: 'workspace' // Distinguish from regular chat
      },
      include: {
        messages: true,
        files: true,
        _count: { select: { messages: true, files: true } }
      }
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating workspace conversation:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Save generated files to conversation
app.post("/api/workspace/files/:conversationId", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { files } = req.body;

    if (!conversationId || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // First, delete existing files for this conversation
    await prismaClient.workspaceFile.deleteMany({
      where: { conversationId }
    });

    // Then create new files
    const savedFiles = await Promise.all(
      files.map(async (file: any) => {
        return await prismaClient.workspaceFile.create({
          data: {
            conversationId,
            name: file.name,
            path: file.path,
            content: file.content || '',
            type: file.type
          }
        });
      })
    );

    return res.status(201).json({ 
      message: "Files saved successfully", 
      count: savedFiles.length 
    });
  } catch (error) {
    console.error('Error saving files:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get workspace conversation with files
app.get("/api/workspace/conversation/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const conversation = await prismaClient.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        files: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get workspace conversations for user
app.get("/api/workspace/history/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const conversations = await prismaClient.conversation.findMany({
      where: { 
        userId,
        type: 'workspace' 
      },
      include: {
        files: true,
        _count: { 
          select: { 
            messages: true,
            files: true 
          } 
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching workspace history:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete conversation (works for both chat and workspace)
app.delete("/api/conversation/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    await prismaClient.conversation.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

// Get all conversations for user (both chat and workspace)
app.get("/api/all-conversations/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing required field" });
    }

    const conversations = await prismaClient.conversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        files: true,
        _count: { 
          select: { 
            messages: true,
            files: true 
          } 
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Unified backend is running",
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(8081, () => {
  console.log(`Unified backend running on port 8081`);
});