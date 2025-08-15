"use client"
import { SessionProvider } from "next-auth/react";
import LoginPage from "@/components/sign-in";

export default function Signin() {
  return <SessionProvider>
    <LoginPage />
  </SessionProvider>

}