import { config } from '@/config';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Paperclip, Link as LinkIcon, X, FileText, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  onFilesChange?: (files: File[]) => void;
  placeholder?: string;
  uploadProgress?: Record<number, number>; // index mapped to percentage
  failedUploads?: number[];
}

export const RichEditor: React.FC<RichEditorProps> = ({ value, onChange, onFilesChange, placeholder, uploadProgress, failedUploads }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        validate: href => /^https?:\/\/|data:/.test(href),
        HTMLAttributes: {
          class: 'text-blue-400 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto shadow-sm my-4',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Type your message here...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value === '' && editor.getText() !== '') {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  // COMPLETE REWRITE OF addFiles to avoid side-effect in setState
  const addFilesSafe = useCallback((files: File[]) => {
     setAttachedFiles(prev => {
        if (prev.length + files.length > config.MAX_FILE_COUNT) {
           toast.error(`You can only attach up to ${config.MAX_FILE_COUNT} files at a time.`);
           return prev;
        }
        
        const maxSize = config.MAX_FILE_SIZE_BYTES; 
        const currentSize = prev.reduce((acc, file) => acc + file.size, 0);
        let newTotalSize = currentSize;
        const validFiles: File[] = [];
        let sizeExceeded = false;
        
        for (const file of files) {
           if (newTotalSize + file.size > maxSize) {
             sizeExceeded = true;
             toast.error(`Total size exceeds 25MB. "${file.name}" cannot be added.`);
             break;
           }
           newTotalSize += file.size;
           validFiles.push(file);
        }

        if (sizeExceeded) {
           // Toasts handled in loop or just return prev.
           // Since we broke locally, we might have multiple files.
           // If we just want to warn about the file that broke the camel's back:
           return prev;
        }

        const newFiles = [...prev, ...validFiles];
        // Don't call onFilesChange here!
        return newFiles;
     });
  }, []);

  // Sync to parent whenever attachedFiles changes
  useEffect(() => {
    if (onFilesChange) {
       onFilesChange(attachedFiles);
    }
  }, [attachedFiles, onFilesChange]);

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const clearAllFiles = () => {
    setAttachedFiles([]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesSafe(Array.from(e.dataTransfer.files));
    }
  }, [addFilesSafe]);

  const openLinkDialog = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkDialogOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // If empty selection, insert the link text
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setIsLinkDialogOpen(false);
    setLinkUrl('');
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesToAdd = Array.from(e.target.files);
      // Reset input immediately to allow re-selecting same file if needed and prevent double events in some browsers
      e.target.value = '';
      addFilesSafe(filesToAdd);
    }
  };

  if (!editor) {
    return <div className="min-h-[300px] border border-border bg-background animate-pulse" />;
  }

  return (
    <>
      <div 
        className={`flex flex-col w-full border overflow-hidden bg-background transition-colors resize-y ${editor.isFocused ? 'border-zinc-600' : 'border-border'}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-surface/50 min-h-[40px]">
          <Button variant="ghost" size="icon" onClick={triggerFileUpload} title="Attach File or Image">
            <Paperclip size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={openLinkDialog} title="Insert Link">
            <LinkIcon size={14} />
          </Button>
        </div>

        {/* Editable Area */}
        <div className="flex-1 max-h-[600px] overflow-y-auto cursor-text bg-transparent">
          <EditorContent editor={editor} />
        </div>

        {/* Attachments Area - Outside Editor */}
        {attachedFiles.length > 0 && (
          <div className="p-2 border-t border-border bg-surface/10">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">Attachments ({attachedFiles.length})</span>
              <button 
                onClick={clearAllFiles}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={12} />
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="group relative flex items-center gap-2 pl-2 pr-8 py-1.5 bg-surface border border-border hover:bg-surface/80 transition-colors">
                <FileText size={16} className="text-muted-foreground" />
                <div className="flex flex-col min-w-0 max-w-[150px] w-full">
                  <span className="text-xs font-medium truncate text-foreground" title={file.name}>{file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                    {failedUploads?.includes(index) ? (
                        <span className="text-[10px] text-red-500 font-medium">Failed</span>
                    ) : uploadProgress && uploadProgress[index] !== undefined && (
                      <span className="text-[10px] text-zinc-400">{uploadProgress[index]}%</span>
                    )}
                  </div>
                  {uploadProgress && uploadProgress[index] !== undefined && !failedUploads?.includes(index) && (
                    <div className="w-full h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-zinc-100 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                  )}
                </div>
                {uploadProgress && uploadProgress[index] !== undefined && !failedUploads?.includes(index) ? (
                   <div className="ml-auto flex items-center justify-center p-1">
                      {uploadProgress[index] < 100 ? (
                        <Loader2 size={12} className="animate-spin text-zinc-100" />
                      ) : (
                        <X size={12} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => removeFile(index)} />
                      )}
                   </div>
                ) : (
                  <button 
                    onClick={() => removeFile(index)}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 transition-colors ${failedUploads?.includes(index) ? 'text-red-500 hover:text-red-400' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {failedUploads?.includes(index) ? <AlertCircle size={14} /> : <X size={12} />}
                  </button>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Input
                type="url"
                id="link"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyLink();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={applyLink}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
