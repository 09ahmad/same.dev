"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FileExplorer, FileNode } from '@/components/workspace/FileExplorer';
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
const router = useRouter();
const searchParams = useSearchParams();
const prompt = searchParams.get('prompt') || '';

const [steps , setSteps]=useState<Step[]>([])

const [files,setFiles]=useState<FileItem[]>([])

const { webcontainer, isLoading: webContainerLoading, error: webContainerError } = useWebContainer();


const [selectedFile, setSelectedFile] = useState<FileItem | undefined>(undefined);
const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
const [currentStep, setCurrentStep] = useState(0);
// Removed isExpanded state

  useEffect(() => {
  let originalFiles = [...files];
  let updateHappened = false;
  steps.filter(({status}) => status === "pending").map(step => {
    updateHappened = true;
    if (step?.type === StepType.CreateFile) {
      let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
      let currentFileStructure = [...originalFiles]; // {}
      let finalAnswerRef = currentFileStructure;

      let currentFolder = ""
      while(parsedPath.length) {
        currentFolder =  `${currentFolder}/${parsedPath[0]}`;
        let currentFolderName = parsedPath[0];
        parsedPath = parsedPath.slice(1);

        if (!parsedPath.length) {
          // final file
          let file = currentFileStructure.find(x => x.path === currentFolder)
          if (!file) {
            currentFileStructure.push({
              name: currentFolderName,
              type: 'file',
              path: currentFolder,
              content: step.code
            })
          } else {
            file.content = step.code;
          }
        } else {
          /// in a folder
          let folder = currentFileStructure.find(x => x.path === currentFolder)
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

  })

  if (updateHappened) {

    setFiles(originalFiles)
    setSteps(steps => steps.map((s: Step) => {
      return {
        ...s,
        status: "completed"
      }
      
    }))
  }
  console.log(files);
}, [steps, files]);

useEffect(() => {

  if (!webcontainer || webContainerLoading) {
    return;
  }
  const createMountStructure = (files: FileItem[]): Record<string, any> => {
    const mountStructure: Record<string, any> = {};

    const processFile = (file: FileItem, isRootFolder: boolean) => {  
      if (file.type === 'folder') {
        // For folders, create a directory entry
        mountStructure[file.name] = {
          directory: file.children ? 
            Object.fromEntries(
              file.children.map(child => [child.name, processFile(child, false)])
            ) 
            : {}
        };
      } else if (file.type === 'file') {
        if (isRootFolder) {
          mountStructure[file.name] = {
            file: {
              contents: file.content || ''
            }
          };
        } else {
          // For files, create a file entry with contents
          return {
            file: {
              contents: file.content || ''
            }
          };
        }
      }

      return mountStructure[file.name];
    };

    // Process each top-level file/folder
    files.forEach(file => processFile(file, true));

    return mountStructure;
  };

  const mountStructure = createMountStructure(files);

  // Mount the structure if WebContainer is available
  console.log(mountStructure);
  webcontainer?.mount(mountStructure);
}, [files, webcontainer]);



async function init(){
  const response = await axios.post(`${BACKEND_URL}/api/template`,{
    prompt:prompt.trim()
  })
  
  const {prompts,uiPrompts}=response.data as {prompts:string[],uiPrompts:string[]}

  // setSteps(uiPrompts.map((x:string)=>parseXml(x)).flat())
  // setSteps(parseXml(uiPrompts[0]));
  // setSteps(uiPrompts.length > 0 ? parseXml(uiPrompts[0]) : [])
  

  setSteps(parseXml(uiPrompts[0]).map((x:Step)=>({
    ...x,
    status:"pending"
  })))

        


  const stepsResponse = await axios.post(`${BACKEND_URL}/api/chat`,{
    messages:[...(prompts || []),...(uiPrompts || []),prompt].map(content=>({
      role:"user",
      content
    }))
  })
    setSteps(s => [...s, ...parseXml((stepsResponse.data as {response: string}).response).map(x => ({
    ...x,
    status: "pending" as "pending"
  }))]);
}
useEffect(()=>{
  init()
},[])

  // Helper to recursively add files/folders to zip
  const addFilesToZip = (zip: JSZip, items: FileItem[], parentPath = '') => {
    items.forEach(item => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.type === 'file') {
        zip.file(fullPath, item.content || '');
      } else if (item.type === 'folder' && item.children) {
        addFilesToZip(zip.folder(fullPath)!, item.children, fullPath);
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

{webContainerLoading && (
      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Initializing WebContainer...</p>
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
          <input type="text" placeholder="Ask something..." className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </LLMOutput>
    </StepsSidebar>
    {/* Main Content */}
    <main className="flex-1 p-4 flex flex-col gap-4">
      {/* Removed Workspace header and Prompt line */}
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
              className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors border border-border"
              onClick={handleDownload}
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
                <CodeEditor file={selectedFile}  /> 
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