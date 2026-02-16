"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { feedbackSchema, type FeedbackInput } from '@/schemas/feedback';
import { useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { mutate: submitFeedback, isPending } = useFeedback();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      email: '',
      message: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data: FeedbackInput) => {
    submitFeedback(data, {
      onSuccess: () => {
        toast.success("Feedback sent! Thank you for helping us improve.");
        reset();
        onClose();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to send feedback");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-zinc-100">Request Feature</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X size={14} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Found a bug or have an idea? Let us know. We read every message.
          </p>
          
          <div className="space-y-1">
            <input
              {...register('email')}
              type="email"
              placeholder="Email (optional)"
              className="w-full p-3 text-sm bg-surface border border-border focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-muted-foreground/50"
            />
            {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <textarea
              {...register('message')}
              className="w-full min-h-[120px] p-3 text-sm bg-surface border border-border resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-muted-foreground/50"
              placeholder="Describe your suggestion..."
            />
            {errors.message && <p className="text-[10px] text-red-500">{errors.message.message}</p>}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Send size={14} className="mr-2" />
              )}
              {isPending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
