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




// import { FileItem } from '@/lib/types';
// import dynamic from 'next/dynamic';
// import { useState } from 'react';
// import { Skeleton } from '../ui/skeleton';
// const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// type CodeEditorProps={
//   file :FileItem | undefined
// }

// export function CodeEditor({ file }:CodeEditorProps){
//   const [loading , setLoading] = useState(false);

  // if(!loading){
  //   return(
  //     <div className='flex items-center space-x-4'>
  //       <Skeleton className='h-12 w-12 rounded-full' />
  //       <div className='space-y-2'>
  //         <Skeleton className='h-4 w-[250px]' />
  //         <Skeleton className='h-4 w-[200px]' />
  //       </div>
  //     </div>
  //   )
  // }

//   if (!file) {
//     return (
//       <div className="flex flex-col justify-center items-center h-full p-8 w-full">
//         <span className="text-muted-foreground">Select a file to view its contents</span>
//       </div>
//     );
//   }

// } 