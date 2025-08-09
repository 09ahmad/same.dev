"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";
import { Skeleton } from "@/components/ui/skeleton"


export default function AppbarAuth() {
  const router = useRouter();
  const { status} = useSession();
  console.log(status);
  return (
    <>
      {status === "loading" && <div><CustomSkeleton /></div>}
      {console.log(status)}
      {status === "unauthenticated" && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push("/signin")}>
            Sign in
          </Button>
          <Button onClick={() => router.push("/signin")}>
            Getting Started
          </Button>
        </div>
      )}
      {status === "authenticated" && <div><Avatar/></div>}
      {console.log(status)}
    </>
  );
}

function CustomSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-xl bg-pink-200" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-[130px]" />
      </div>
    </div>
  )
}