"use client";

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from './ui/Button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    console.log("Feedback submitted:", feedback);
    setFeedback('');
    onClose();
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
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Found a bug or have an idea? Let us know. We read every message.
          </p>
          
          <textarea
            className="w-full min-h-[120px] p-3 text-sm bg-surface border border-border resize-none focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder:text-muted-foreground/50"
            placeholder="Describe your suggestion..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" className="w-full sm:w-auto">
              <Send size={14} className="mr-2" />
              Send Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
