import { BACKEND_URL2 } from "./config";

export type Role = "user" | "assistant";

export interface Conversation {
	id: string;
	title: string | null;
	type?: string | null;
	updatedAt?: string;
	createdAt?: string;
	messages?: { id: string; role: Role; content: string; createdAt: string }[];
}

export async function ensureUser(params: { username: string; fullName: string }) {
	const res = await fetch(`${BACKEND_URL2}/api/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!res.ok) throw new Error("Failed to ensure user");
	return res.json();
}

export async function createChatConversation(params: { userId: string; title?: string }) {
	const res = await fetch(`${BACKEND_URL2}/api/conversation`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ...params, title: params.title ?? "New conversation" }),
	});
	if (!res.ok) throw new Error("Failed to create conversation");
	return res.json() as Promise<Conversation>;
}

export async function createWorkspaceConversation(params: { userId: string; title?: string; prompt: string; template?: string }) {
	const res = await fetch(`${BACKEND_URL2}/api/workspace/conversation`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!res.ok) throw new Error("Failed to create workspace conversation");
	return res.json() as Promise<Conversation>;
}

export async function addMessage(conversationId: string, message: { role: Role; content: string }) {
	const res = await fetch(`${BACKEND_URL2}/api/messages/${conversationId}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(message),
	});
	if (!res.ok) throw new Error("Failed to add message");
	return res.json();
}

export async function fetchChatHistory(userId: string) {
	const res = await fetch(`${BACKEND_URL2}/api/history/${userId}`);
	if (!res.ok) throw new Error("Failed to fetch chat history");
	return res.json() as Promise<Conversation[]>;
}

export async function fetchWorkspaceHistory(userId: string) {
	const res = await fetch(`${BACKEND_URL2}/api/workspace/history/${userId}`);
	if (!res.ok) throw new Error("Failed to fetch workspace history");
	return res.json() as Promise<Conversation[]>;
}

export async function deleteConversation(conversationId: string) {
	const res = await fetch(`${BACKEND_URL2}/api/conversation/${conversationId}`, { method: "DELETE" });
	if (!res.ok) throw new Error("Failed to delete conversation");
	return res.json();
}

export async function fetchAllConversations(userId: string) {
	const res = await fetch(`${BACKEND_URL2}/api/all-conversations/${userId}`);
	if (!res.ok) throw new Error("Failed to fetch conversations");
	return res.json() as Promise<Conversation[]>;
} 