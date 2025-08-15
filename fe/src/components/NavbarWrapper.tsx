"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const hideNavbarRoutes = ["/workspace","/signin"];

  if (hideNavbarRoutes.includes(pathname)) return null;

  return <Navbar />;
}
