"use client"
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileExplorer } from '@/components/workspace/FileExplorer';
import { CodeEditor } from '@/components/workspace/CodeEditor';
import { PreviewPane } from '@/components/workspace/PreviewPane';
import { StepsSidebar } from '@/components/workspace/StepsSidebar';
import { LLMOutput } from '@/components/workspace/LLMOutput';
import { FileItem, Step, StepType } from '@/lib/types';
import { BACKEND_URL } from '@/lib/config';
import axios from 'axios';
import { parseXml } from '@/lib/parser/steps';
import { useWebContainer } from '@/lib/hooks/useWebContainer';
import JSZip from 'jszip';

export default function Workspace() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt') || '';

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string}[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  
  const { webcontainer, isLoading: webContainerLoading, error: webContainerError } = useWebContainer();

  const [selectedFile, setSelectedFile] = useState<FileItem | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [currentStep, setCurrentStep] = useState(0);

  // Process steps and update files (fixed path handling)
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    
    steps.filter(({status}) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/").filter(Boolean) ?? [];
        let currentFileStructure = [...originalFiles];
        const finalAnswerRef = currentFileStructure;

        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder = currentFolder ? `${currentFolder}/${parsedPath[0]}` : parsedPath[0];
          const currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);

          if (!parsedPath.length) {
            // final file
            const file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code || ''
              })
            } else {
              file.content = step.code || '';
            }
          } else {
            // in a folder
            const folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }

            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }
    });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps(steps => steps.map((s: Step) => ({
        ...s,
        status: "completed"
      })));
    }
  }, [steps]);

  // Mount files to WebContainer (improved version)
  useEffect(() => {
    if (!webcontainer || webContainerLoading || files.length === 0) {
      return;
    }

    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processItems = (items: FileItem[], target: Record<string, any>) => {
        items.forEach(item => {
          if (item.type === 'file') {
            target[item.name] = {
              file: {
                contents: item.content || ''
              }
            };
          } else if (item.type === 'folder' && item.children) {
            target[item.name] = {
              directory: {}
            };
            processItems(item.children, target[item.name].directory);
          }
        });
      };

      processItems(files, mountStructure);
      return mountStructure;
    };

    const mountFiles = async () => {
      try {
        const mountStructure = createMountStructure(files);
        console.log('Mounting structure:', mountStructure);
        await webcontainer.mount(mountStructure);
        console.log('Files mounted successfully');
      } catch (error) {
        console.error('Failed to mount files:', error);
      }
    };

    mountFiles();
  }, [files, webcontainer, webContainerLoading]);

  // Initialize the workspace
  async function init() {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/template`, {
        prompt: prompt.trim()
      });
      setTemplateSet(true);
      
      const { prompts, uiPrompts } = response.data as { prompts: string[], uiPrompts: string[] };

      // Initial steps from template
      setSteps(() => {
        const initialSteps = parseXml(uiPrompts[0]);
        return initialSteps.map((x, idx) => ({
          ...x,
          id: idx + 1,
          status: 'pending'
        }));
      });

      setLoading(true);
      const stepsResponse = await axios.post(`${BACKEND_URL}/api/chat`, {
        messages: [...prompts, prompt].map(content => ({
          role: "user",
          content
        }))
      });

      setLoading(false);

      setSteps(s => {
        const offset = s.length > 0 ? Math.max(...s.map(step => step.id)) : 0;
        const newSteps = parseXml(stepsResponse.data.response).map((x, idx) => ({
          ...x,
          id: offset + idx + 1,
          status: 'pending' as 'pending'
        }));
        return [...s, ...newSteps];
      });

      setLlmMessages([...prompts, prompt].map(content => ({
        role: "user",
        content
      })));

      setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }]);
    } catch (error) {
      console.error('Failed to initialize:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  // Handle sending new messages
  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    const newMessage = {
      role: "user" as "user",
      content: userPrompt
    };

    setLoading(true);
    try {
      const stepsResponse = await axios.post(`${BACKEND_URL}/api/chat`, {
        messages: [...llmMessages, newMessage]
      });
      
      setLlmMessages(x => [...x, newMessage, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);
      
      setSteps(s => {
        const offset = s.length > 0 ? Math.max(...s.map(step => step.id)) : 0;
        const newSteps = parseXml(stepsResponse.data.response).map((x, idx) => ({
          ...x,
          id: offset + idx + 1,
          status: 'pending' as 'pending'
        }));
        return [...s, ...newSteps];
      });

      setUserPrompt("");
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to recursively add files/folders to zip
  const addFilesToZip = (zip: JSZip, items: FileItem[], parentPath = '') => {
    items.forEach(item => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.type === 'file') {
        zip.file(fullPath, item.content || '');
      } else if (item.type === 'folder' && item.children) {
        addFilesToZip(zip, item.children, fullPath);
      }
    });
  };

  // Download handler
  const handleDownload = async () => {
    const zip = new JSZip();
    addFilesToZip(zip, files);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-background">

      {(webContainerLoading || loading || !templateSet) && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              {webContainerLoading ? 'Initializing WebContainer...' : 
               !templateSet ? 'Setting up template...' : 'Processing...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Show error state for WebContainer */}
      {webContainerError && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center text-red-500">
            <p className="text-sm">Failed to initialize WebContainer</p>
            <p className="text-xs text-muted-foreground mt-1">{webContainerError}</p>
          </div>
        </div>
      )}
      
      {/* Steps Sidebar (always visible) */}
      <StepsSidebar steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep}>
        <LLMOutput>
          <div className="absolute left-0 bottom-4 w-full px-4">
            {!(loading || !templateSet) && !webContainerLoading && (
              <div className="flex flex-col gap-2">
                <textarea 
                  value={userPrompt} 
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Ask something..."
                  className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!userPrompt.trim() || loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted-foreground text-primary-foreground px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </LLMOutput>
      </StepsSidebar>
      
      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        <div className="flex flex-1 flex-col h-full">
          {/* Tabs and Editor/Preview */}
          <div className="flex items-center border-b border-border mb-4">
            <button
              className={`px-4 py-2 font-semibold focus:outline-none ${activeTab === 'code' ? 'bg-card text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('code')}
            >
              Code
            </button>
            <button
              className={`px-4 py-2 font-semibold focus:outline-none ${activeTab === 'preview' ? 'bg-card text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            {/* Download Button */}
            {activeTab === 'code' && (
              <button
                className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors border border-border disabled:bg-muted-foreground disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={files.length === 0}
                type="button"
              >
                Download All
              </button>
            )}
          </div>
          <div className="flex-1 flex min-h-[350px]">
            {activeTab === 'code' && (
              <div className="flex flex-1 gap-0 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                {/* File Explorer Sidebar (always visible in code tab) */}
                <aside className="w-56 bg-background border-r border-border p-4 overflow-y-auto">
                  <FileExplorer tree={files} selected={selectedFile || ''} onFileSelect={setSelectedFile} />
                </aside>
                {/* Monaco Editor or placeholder */}
                <div className="flex-1">
                  <CodeEditor file={selectedFile} /> 
                </div>
              </div>
            )}
            {activeTab === 'preview' && webcontainer && (
              <div className="flex-1 bg-card rounded-xl border border-border shadow-lg p-4">
                <PreviewPane webContainer={webcontainer} files={files} />
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="absolute bottom-2 left-0 w-full text-center text-xs text-muted-foreground">© {new Date().getFullYear()} AI Website Creator</footer>
    </div>
  );
}
