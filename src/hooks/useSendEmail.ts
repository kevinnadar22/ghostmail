import { useMutation } from "@tanstack/react-query";
import { sendEmail, type SendEmailPayload } from "@/lib/api/email";
import { toast } from "sonner";

export function useSendEmail() {
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      toast.success("Email sent successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send email");
    },
  });
}
