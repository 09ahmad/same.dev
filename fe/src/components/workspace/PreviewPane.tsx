import { WebContainer } from "@webcontainer/api";
import React, { useEffect, useState, useRef } from "react";
import stripAnsi from "strip-ansi";

interface PreviewFrameProps {
  files: any;
  webContainer: WebContainer;
  onUrlReady?:(url: string) => void; 
}

const PreviewPane = React.memo(function PreviewPane({
  files,
  webContainer,
  onUrlReady
}: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    hasInitialized.current = false;
  }, [webContainer]);

  useEffect(() => {
    if (hasInitialized.current || !webContainer) {
      return;
    }
    hasInitialized.current = true;

    async function initPreview() {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Starting npm install...");
        const installProcess = await webContainer.spawn("npm", ["install"]);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(stripAnsi(data));
            },
          })
        );

        await installProcess.exit;

        console.log("Starting dev server...");
        await webContainer.spawn("npm", ["run", "dev"]);

        webContainer.on("server-ready", (port, url) => {
          console.log("Server ready:", { port, url });
          setUrl(url);
          setIsLoading(false);
          onUrlReady?.(url); 
        });
      } catch (err) {
        console.error("Preview initialization failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initialize preview"
        );
        setIsLoading(false);
      }
    }

    initPreview();
    return () => {
    };
  }, [webContainer]);

  if (!files) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 w-full bg-card rounded-xl border border-border shadow-lg">
        <span className="text-muted-foreground">Select a file to preview</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 w-full bg-card rounded-xl border border-border shadow-lg">
        <div className="text-center text-red-500">
          <p className="mb-2">Preview Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {isLoading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="mb-2">Setting up preview...</p>
          <p className="text-sm text-muted-foreground">
            Installing dependencies and starting dev server
          </p>
        </div>
      )}
      {url && !isLoading && (
        <iframe
          width="100%"
          height="100%"
          src={url}
          title="Preview"
          className="border-0 rounded"
        />
      )}
    </div>
  );
});

export default PreviewPane;
