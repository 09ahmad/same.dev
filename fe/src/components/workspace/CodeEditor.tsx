import { FileItem } from '@/lib/types';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeEditorProps={
  file :FileItem | undefined
}

export function CodeEditor({ file }:CodeEditorProps){
  if (!file) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 w-full">
        <span className="text-muted-foreground">Select a file to view its contents</span>
      </div>
    );
  }
  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="typescript"
      theme="vs-dark"
      value={file.content || ""}
      options={{ readOnly: true, fontSize: 14, minimap: { enabled: false }, wordWrap: 'on' ,scrollBeyondLastLine:false}}
    />
  );
} 
