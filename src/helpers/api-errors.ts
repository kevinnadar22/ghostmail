import { ZodError } from "zod";

/**
 * Helper to conform to the requested error handling pattern.
 */
export const treeifyError = (error: ZodError) => {
  return {
    errors: error.issues.map((err) => err.message),
  };
};

export const parseZodError = (error: ZodError) => {
  const errorTree = treeifyError(error);
  const errors = errorTree.errors;
  // make it a string
  return errors.join(", ");
};
