-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "template" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'chat';

-- CreateTable
CREATE TABLE "public"."WorkspaceFile" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceFile_conversationId_idx" ON "public"."WorkspaceFile"("conversationId");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "public"."Conversation"("type");

-- AddForeignKey
ALTER TABLE "public"."WorkspaceFile" ADD CONSTRAINT "WorkspaceFile_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
