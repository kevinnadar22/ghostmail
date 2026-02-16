"use client";

import { Turnstile } from '@marsidev/react-turnstile';
import { config } from '@/config';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MessageSquarePlus,
  Ghost,
  AlertCircle,
  History,
  Loader2
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailFormSchema, type EmailFormValues } from '@/schemas';

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
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      fromName: '',
      subject: '',
      body: '',
    }
  });

  const [captchaToken, setCaptchaToken] = useState<string>("");
  const captchaToastIdRef = React.useRef<string | number | null>(null);
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

  const executeSend = async (data: EmailFormValues, keys: string[]) => {
    const toastId = toast.loading("Sending email... Please wait");
    try {
      await sendEmail({
        to: data.to,
        fromName: data.fromName,
        subject: data.subject || "No Subject",
        html: (data.body && data.body !== "<p></p>") ? data.body : " ",
        files: keys,
        captchaToken: captchaToken,
      });


      toast.dismiss(toastId);

      // Reset form on success
      reset();
      setFiles([]);
      setUploadProgress({});
      setFailedUploads([]);
      setUploadedKeys([]);
      setCaptchaToken("");
      setEditorKey(prev => prev + 1);
      setIsConfirmOpen(false);
      if (turnstileRef.current) turnstileRef.current.reset();
      toast.success("Email sent successfully! Check spam folders too.");
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Failed to send email flow", error);
      toast.error(error.message || "Failed to send email. Please try again.");
    }
  };

  const onSubmit = async (data: EmailFormValues) => {
    const isBodyEmpty = !data.body || data.body === "<p></p>";
    if (isBodyEmpty && files.length === 0) {
      toast.error("Please provide a message or at least one attachment.");
      return;
    }

    if (!captchaToken) {
      turnstileRef.current?.execute();
      if (!captchaToastIdRef.current) {
        captchaToastIdRef.current = toast.loading("Verifying security...");
      }
      return;
    }

    if (files.length > config.MAX_FILE_COUNT) {
      toast.error(`You can only attach up to ${config.MAX_FILE_COUNT} files.`);
      return;
    }


    // Save history
    const normalizedEmail = data.to.trim();
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
            onProgress: (progress: number) => {
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

    await executeSend(data, currentUploadedKeys);
  };

  // Automatically continue sending after verification
  useEffect(() => {
    if (captchaToken) {
      handleSubmit(onSubmit)();
    }
  }, [captchaToken, handleSubmit]);


  const formData = watch();

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

        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="https://mariakevin.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-zinc-300 transition-colors border-b border-zinc-800 pb-0.5"
          >
            Contact
          </a>
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="group inline-flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-zinc-300 transition-colors border-b border-zinc-800 pb-0.5 whitespace-nowrap"
          >
            <MessageSquarePlus size={10} className="sm:size-[12px]" />
            <span>Feedback</span>
          </button>
        </div>
      </div>

      {/* Main Composer Card */}
      <div className="w-full max-w-3xl bg-background border border-border shadow-sm p-1">

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-8 space-y-6">

          {/* Top Inputs: To & From */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <Input
                label="Recipient (To)"
                type="email"
                placeholder="victim@example.com"
                {...register("to")}
              />
              {errors.to && <span className="text-[10px] text-red-500 pl-1">{errors.to.message}</span>}
              {recentEmails.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
                  <History size={10} className="text-muted-foreground/50" />
                  {recentEmails.slice(0, 2).map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setValue("to", email, { shouldValidate: true })}
                      className="text-[10px] text-muted-foreground hover:text-zinc-200 bg-surface/50 hover:bg-surface border border-transparent hover:border-zinc-700 px-2 py-0.5 transition-all cursor-pointer truncate max-w-[180px]"
                      title={`Use ${email}`}
                    >
                      {email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Input
                label="Alias (From) (Optional)"
                type="text"
                placeholder="Someone Mysterious"
                {...register("fromName")}
              />
              {errors.fromName && <span className="text-[10px] text-red-500 pl-1">{errors.fromName.message}</span>}
            </div>
          </div>

          {/* Subject Line */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Subject (Optional)"
              type="text"
              placeholder="Regarding the secret project..."
              className="font-medium"
              {...register("subject")}
            />
            {errors.subject && <span className="text-[10px] text-red-500 pl-1">{errors.subject.message}</span>}
          </div>

          {/* Editor */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Message</label>
            </div>
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <RichEditor
                  key={editorKey}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onFilesChange={setFiles}
                  uploadProgress={uploadProgress}
                  failedUploads={failedUploads}
                  placeholder="Compose your encrypted message here... Drag & Drop files supported."
                />
              )}
            />
            {errors.body && <span className="text-[10px] text-red-500 pl-1">{errors.body.message}</span>}

          </div>

          {/* Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row justify-end items-end border-t border-border mt-6 gap-4">

            {config.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={config.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => {

                  // if the loading toast exists, dismiss it
                  if (captchaToastIdRef.current) {
                    toast.dismiss(captchaToastIdRef.current);
                    captchaToastIdRef.current = null;
                  }
                  setCaptchaToken(token);
                }}
                onExpire={() => {
                  setCaptchaToken("");

                  // if the loading toast exists, dismiss it
                  if (captchaToastIdRef.current) {
                    toast.dismiss(captchaToastIdRef.current);
                    captchaToastIdRef.current = null;
                  }
                }}
                onError={(error) => {
                  console.error("Turnstile error:", error);
                  setCaptchaToken("");

                  // if the loading toast exists, dismiss it
                  if (captchaToastIdRef.current) {
                    toast.dismiss(captchaToastIdRef.current);
                    captchaToastIdRef.current = null;
                  }
                  toast.error("Security verification failed. Please try again.");
                }}
                options={{
                  theme: "dark",
                  appearance: "interaction-only",
                  execution: "execute",
                }}
              />
            )}

            <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto justify-end">
              <Button
                type="submit"
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

        </form>
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
            <Button variant="ghost" type="button" onClick={() => setIsConfirmOpen(false)} disabled={isSending}>Cancel</Button>
            <Button variant="secondary" type="button" onClick={() => executeSend(formData, uploadedKeys)} disabled={isSending}>
              {isSending ? <Loader2 size={16} className="animate-spin" /> : "Send Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

    </div>
  );
};

export default App;
