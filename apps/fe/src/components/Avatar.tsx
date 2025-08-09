"use client";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Avatar() {
  const { data: session } = useSession();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg">
          {!session?.user?.name ? (
            <div className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-black font-bold bg-red-100 flex-shrink-0">
                H
              </div>
              <div className="font-bold text-sm sm:text-base truncate">Hi there</div>
            </div>
          ) : (
            <div className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors duration-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-black font-bold bg-red-100 flex-shrink-0">
                {session?.user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                {session?.user?.name}
              </div>
            </div>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent className="w-[280px] sm:w-[350px] flex flex-col p-0">
        {/* Header Section */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-left text-lg font-semibold">Profile</SheetTitle>
            
            {!session?.user?.name ? (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl text-black font-bold bg-red-100 flex-shrink-0">
                  H
                </div>
                <div className="font-bold text-base">Hi there</div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl text-black font-bold bg-red-100 flex-shrink-0">
                  {session?.user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="font-bold text-base truncate">
                    {session?.user?.name}
                  </div>
                  {session?.user?.email && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {session?.user?.email}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetHeader>
        </div>
        
        {/* Spacer - grows to push button to bottom */}
        <div className="flex-1" />
        
        {/* Bottom Section with Sign Out Button */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t bg-gray-50/50 dark:bg-gray-800/20">
          {session?.user && (
            <Button
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              variant="destructive"
              onClick={() => {
                signOut();
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}