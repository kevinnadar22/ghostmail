"use client";

import { Turnstile } from '@marsidev/react-turnstile';
import { config } from '@/config';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Send,
  MessageSquarePlus,
  Ghost,
  AlertCircle,
  History,
  Loader2
} from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RichEditor } from '@/components/RichEditor';
import { FeedbackModal } from '@/components/FeedbackModal';

import { useSendEmail } from '@/hooks/useSendEmail';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"


const App: React.FC = () => {
  const [formData, setFormData] = useState({
    to: '',
    fromName: '',
    subject: '',
    body: '',
  });

  const [captchaToken, setCaptchaToken] = useState<string>("");
  const turnstileRef = React.useRef<any>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [failedUploads, setFailedUploads] = useState<number[]>([]);

  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);

  const { mutateAsync: sendEmail, isPending: isSendingEmail } = useSendEmail();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const isSending = isSendingEmail || isUploading;

  // Load recent emails on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ghost_recipients');
      if (stored) {
        setRecentEmails(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history');
    }
  }, []);

  const executeSend = async (keys: string[]) => {
    const toastId = toast.loading("Sending email... Please wait");
    try {
      await sendEmail({
        to: formData.to,
        fromName: formData.fromName,
        subject: formData.subject || "No Subject",
        html: formData.body,
        files: keys,
        captchaToken: captchaToken,
      });
      
      toast.dismiss(toastId);

      // Reset form on success
      setFormData(prev => ({ ...prev, to: '', subject: '', body: '', fromName: '' }));
      setFiles([]);
      setUploadProgress({});
      setFailedUploads([]);
      setUploadedKeys([]);
      setCaptchaToken("");
      setEditorKey(prev => prev + 1);
      setIsConfirmOpen(false);
      if (turnstileRef.current) turnstileRef.current.reset();
      // Hook handles success toast
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Failed to send email flow", error);
      toast.error("Failed to send email. Please try again.");
    }
  };

  const handleSend = async () => {
    if (!formData.to || !formData.body) {
      toast.error("Recipient and message body are required.");
      return;
    }

    if (!captchaToken) {
      toast.info("Verifying security... Please wait.");
      if (turnstileRef.current) turnstileRef.current.execute();
      return;
    }

    if (files.length > config.MAX_FILE_COUNT) {
      toast.error(`You can only attach up to ${config.MAX_FILE_COUNT} files.`);
      return;
    }

    // Save history
    const normalizedEmail = formData.to.trim();
    if (normalizedEmail) {
      const newHistory = [
        normalizedEmail,
        ...recentEmails.filter(e => e !== normalizedEmail)
      ].slice(0, 5);
      setRecentEmails(newHistory);
      localStorage.setItem('ghost_recipients', JSON.stringify(newHistory));
    }

    setUploadProgress({});
    setFailedUploads([]);
    const currentUploadedKeys: string[] = [];
    const currentFailedIndices: number[] = [];

    if (files.length > 0) {
      // Parallel uploads with tracking
      await Promise.all(files.map(async (file, index) => {
        try {
          const result = await uploadFile({
            file,
            onProgress: (progress) => {
              setUploadProgress(prev => ({ ...prev, [index]: progress }));
            }
          });
          currentUploadedKeys.push(result.key);
        } catch (error) {
          console.error(`Failed to upload ${file.name}`, error);
          currentFailedIndices.push(index);
          setFailedUploads(prev => [...prev, index]);
        }
      }));
    }

    setUploadedKeys(currentUploadedKeys);

    if (currentFailedIndices.length > 0) {
      setIsConfirmOpen(true);
      return;
    }

    await executeSend(currentUploadedKeys);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-zinc-800 selection:text-zinc-100">

      {/* Header */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-surface border border-border">
            <Ghost size={24} className="text-zinc-100" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Ghost Mail</h1>
            <p className="text-sm text-muted-foreground">Untraceable communication</p>
          </div>
        </div>
      </div>

      {/* Main Composer Card */}
      <div className="w-full max-w-3xl bg-background border border-border shadow-sm p-1">

        <div className="p-5 sm:p-8 space-y-6">

          {/* Top Inputs: To & From */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <Input
                label="Recipient (To)"
                type="email"
                placeholder="victim@example.com"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              />
              {recentEmails.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
                  <History size={10} className="text-muted-foreground/50" />
                  {recentEmails.slice(0, 2).map((email) => (
                    <button
                      key={email}
                      onClick={() => setFormData(prev => ({ ...prev, to: email }))}
                      className="text-[10px] text-muted-foreground hover:text-zinc-200 bg-surface/50 hover:bg-surface border border-transparent hover:border-zinc-700 px-2 py-0.5 transition-all cursor-pointer truncate max-w-[180px]"
                      title={`Use ${email}`}
                    >
                      {email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Alias (From) (Optional)"
              type="text"
              placeholder="Someone Mysterious"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
            />
          </div>

          {/* Subject Line */}
          <Input
            label="Subject (Optional)"
            type="text"
            placeholder="Regarding the secret project..."
            className="font-medium"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />

          {/* Editor */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Message</label>
            </div>
            <RichEditor
              key={editorKey}
              value={formData.body}
              onChange={(html) => setFormData({ ...formData, body: html })}
              onFilesChange={setFiles}
              uploadProgress={uploadProgress}
              failedUploads={failedUploads}
              placeholder="Compose your encrypted message here... Drag & Drop files supported."
            />
            <p className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1">
              <AlertCircle size={10} />
              <span>Files and images are embedded directly. Large attachments may impact delivery speed.</span>
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center border-t border-border mt-6 gap-4">
            <div className="text-xs text-muted-foreground hidden sm:block w-full sm:w-auto text-center sm:text-left">
              0 trackers blocked. IP masked.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="w-full sm:w-auto min-w-[120px]"
              >
                {isSending ? (
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /></span>
                ) : (
                  <>
                    Send Anonymously
                  </>
                )}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer / Feedback Trigger */}
      <div className="mt-12 text-center flex justify-center items-center gap-6">
        <a
          href="https://mariakevin.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-muted-foreground hover:text-zinc-300 transition-colors"
        >
          Contact Kevin
        </a>
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-zinc-300 transition-colors"
        >
          <MessageSquarePlus size={14} className="group-hover:scale-110 transition-transform" />
          <span>Request a Feature</span>
        </button>
      </div>

      {/* Modals */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle size={20} />
              Upload Failed
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-zinc-400">
            <p>Some files failed to upload. Do you want to send the email without the failed attachments?</p>
            <ul className="list-disc list-inside mt-2 text-zinc-500">
              {failedUploads.map(index => (
                <li key={index} className="truncate">{files[index]?.name}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} disabled={isSending}>Cancel</Button>
            <Button variant="secondary" onClick={() => executeSend(uploadedKeys)} disabled={isSending}>
              {isSending ? <Loader2 size={16} className="animate-spin" /> : "Send Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invisible Turnstile */}
      {config.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={config.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken("")}
          options={{
            theme: 'dark',
            size: 'invisible' // Non-blocking
          }}
          className="hidden" // Ensure non-blocking visually
        />
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

    </div>
  );
};

export default App;
