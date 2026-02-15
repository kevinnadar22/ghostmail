import { useMutation } from "@tanstack/react-query";
import { sendEmail, type SendEmailPayload } from "@/lib/api/email";
import { toast } from "sonner";

export function useSendEmail() {
  return useMutation({
    mutationFn: sendEmail,
  });
}
