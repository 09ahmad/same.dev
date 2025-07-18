import { useState, useCallback } from 'react';
import { Folder, File as FileIcon } from 'lucide-react';
import { FileItem } from '@/lib/types';

export type FileNode = {
  type: 'file';
  name: string;
} | {
  type: 'folder';
  name: string;
  children: FileNode[];
};

interface FileExplorerProps {
  tree: FileItem[];
  selected: string|FileItem;
  onFileSelect: (file: FileItem) => void;
  level?: number;
}

export function FileExplorer({ tree, selected, onFileSelect, level = 0 }: FileExplorerProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = useCallback((name: string) => {
    setOpenFolders(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  return (
    <ul className={level === 0 ? 'space-y-1' : 'pl-4 space-y-1'}>
      {tree.map((node, idx) => {
        if (node.type === 'folder') {
          const isOpen = openFolders[node.name];
          return (
            <li key={node.name + idx}>
              <div
                className={`flex items-center gap-2 font-semibold cursor-pointer select-none hover:bg-muted/60 rounded px-2 py-1 transition-colors ${isOpen ? 'bg-muted/40' : ''}`}
                style={{ color: '#bfc7d5' }}
                onClick={() => toggleFolder(node.name)}
              >
                <Folder className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                {node.name}
              </div>
              {isOpen && node.children && (
                <FileExplorer tree={node.children} selected={selected} onFileSelect={onFileSelect} level={level + 1} />
              )}
            </li>
          );
        } else {
          return (
            <li
              key={node.name + idx}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm font-mono hover:bg-muted/60 transition-colors ${selected === node.name ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
              onClick={() => onFileSelect(node)}
            >
              <FileIcon className="w-4 h-4" />
              {node.name}
            </li>
          );
        }
      })}
    </ul>
  );
} 