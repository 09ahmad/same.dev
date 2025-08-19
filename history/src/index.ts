import express, { Request, Response } from "express";
import cors from "cors";
import { prismaClient } from "@repo/db/client";
const app = express();

app.use(cors());
app.use(express.json());
// Create new conversation
app.post("/api/user", async (req: Request, res: Response) => {
  try {
    const {username ,fullName } = req.body
    if (!username || !fullName) {
      return res.status(400).json({ error: " Missing field , Email and Name is required" });
    }

    const user = await prismaClient.user.create({
      data: {
        name:fullName,
        email:username
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});
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
    console.log(conversationId);
    const { role, content } = req.body;

    if (!conversationId || !role || !content) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    const conversation = await prismaClient.conversation.findFirst({
      where:{id:conversationId}
    })
    if(!conversation){
      res.status(202).json("Conversation not found")
      return;
    }
    const message = await prismaClient.messages.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
    if(!message){
      res.json("Some error occurs")
    }
    return res.status(201).json(message);
});

// Delete conversation
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

// Get all conversations for user (with messages)
app.get("/api/history/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing required field" });
    }

    const conversations = await prismaClient.conversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

app.listen(8081,()=>{
    console.log(`Unified backend running on port 8081`);
})