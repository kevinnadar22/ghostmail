import { useMutation } from "@tanstack/react-query";
import { sendFeedback } from "@/lib/api/feedback";

export function useFeedback() {
  return useMutation({
    mutationFn: sendFeedback,
  });
}
