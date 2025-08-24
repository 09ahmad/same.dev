"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { status } = useSession();
  const pathname = usePathname();

  // Don't show sidebar on landing page or signin page
  const shouldShowSidebar = status === "authenticated" && 
    !pathname.includes("/signin") && 
    pathname !== "/workspace";

  if (shouldShowSidebar) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <main className="flex-1 min-h-screen">{children}</main>
      </SidebarProvider>
    );
  }
  return <div className="min-h-screen">{children}</div>;
} 