import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]  text-center">
        <DialogHeader className="space-y-2 flex items-center">
          <DialogTitle className="text-3xl font-bold">Same.dev</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Too proceed, authenticate first
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4 p-4">
          <Button
            className="bg-white text-black border hover:bg-slate-400"
            variant="outline"
            onClick={() => router.push(`/signin`)}
          >
            <svg
              className="mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.1 6.1 28.8 4 24 4 13.0 4 4 13 4 24s9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.5-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.4 16.1 18.8 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.1 6.1 28.8 4 24 4 16.5 4 10 8.5 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.3-5.2l-6.1-5.2C29.3 35.8 26.8 37 24 37c-5.2 0-9.6-3.3-11.3-8l-6.6 5C10 39.5 16.5 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1 3-3 5.4-5.6 6.9l.1.1 6.1 5.2C38.9 37.9 42 31.4 42 24c0-1.3-.1-2.5-.4-3.5z"
              />
            </svg>
            Sign in with Google
          </Button>

          <Button
            className="bg-[#24292f] text-white hover:bg-[#1b1f23]"
            onClick={() => router.push(`/signin`)}
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 ...Z" />
            </svg>
            Sign in with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
