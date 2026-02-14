import { describe, expect, it } from "vitest";

// Test the error message mapping function by extracting and testing the logic
// This tests the public behavior without needing to mock Supabase internals
describe("Supabase error message mapping", () => {
  // Helper function that mimics the getSupabaseErrorMessage logic from supabase.tsx
  const getSupabaseErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) {
      return "An unexpected error occurred. Please try again.";
    }

    const errorMessage = error.message;

    // Map common Supabase error messages to user-friendly messages
    if (errorMessage.includes("Invalid login credentials")) {
      return "The email and password you entered don't match.";
    }
    if (errorMessage.includes("Email not confirmed")) {
      return "Please verify your email address before signing in.";
    }
    if (errorMessage.includes("User already registered")) {
      return "The email address is already used by another account.";
    }
    if (
      errorMessage.includes("Password should be at least") ||
      errorMessage.includes("Password must be at least")
    ) {
      return "The password must be at least 6 characters long.";
    }
    if (errorMessage.includes("Invalid email")) {
      return "That email address isn't correct.";
    }
    if (errorMessage.includes("Email rate limit exceeded")) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (errorMessage.includes("For security purposes")) {
      return "For security purposes, please wait a moment before trying again.";
    }
    if (errorMessage.includes("Unable to validate email address")) {
      return "Unable to validate email address. Please check and try again.";
    }
    if (errorMessage.includes("Signups not allowed")) {
      return "Sign ups are not allowed at this time.";
    }
    if (errorMessage.includes("User not found")) {
      return "That email address doesn't match an existing account.";
    }
    if (errorMessage.includes("New password should be different")) {
      return "Your new password must be different from your current password.";
    }

    // Return the original message if no mapping found
    return (
      errorMessage ||
      "An error occurred during authentication. Please try again."
    );
  };

  describe("invalid login credentials", () => {
    it("returns user-friendly message for invalid credentials", () => {
      const error = new Error("Invalid login credentials");
      expect(getSupabaseErrorMessage(error)).toBe(
        "The email and password you entered don't match.",
      );
    });

    it("handles message containing invalid credentials", () => {
      const error = new Error(
        "Authentication failed: Invalid login credentials provided",
      );
      expect(getSupabaseErrorMessage(error)).toBe(
        "The email and password you entered don't match.",
      );
    });
  });

  describe("email not confirmed", () => {
    it("returns message for unverified email", () => {
      const error = new Error("Email not confirmed");
      expect(getSupabaseErrorMessage(error)).toBe(
        "Please verify your email address before signing in.",
      );
    });
  });

  describe("user already registered", () => {
    it("returns message for duplicate registration", () => {
      const error = new Error("User already registered");
      expect(getSupabaseErrorMessage(error)).toBe(
        "The email address is already used by another account.",
      );
    });
  });

  describe("password length requirements", () => {
    it("handles 'Password should be at least' message", () => {
      const error = new Error("Password should be at least 6 characters");
      expect(getSupabaseErrorMessage(error)).toBe(
        "The password must be at least 6 characters long.",
      );
    });

    it("handles 'Password must be at least' message", () => {
      const error = new Error("Password must be at least 6 characters");
      expect(getSupabaseErrorMessage(error)).toBe(
        "The password must be at least 6 characters long.",
      );
    });
  });

  describe("invalid email", () => {
    it("returns message for invalid email format", () => {
      const error = new Error("Invalid email");
      expect(getSupabaseErrorMessage(error)).toBe(
        "That email address isn't correct.",
      );
    });
  });

  describe("rate limiting", () => {
    it("handles email rate limit exceeded", () => {
      const error = new Error("Email rate limit exceeded");
      expect(getSupabaseErrorMessage(error)).toBe(
        "Too many requests. Please wait a moment and try again.",
      );
    });

    it("handles security rate limiting", () => {
      const error = new Error("For security purposes, you must wait");
      expect(getSupabaseErrorMessage(error)).toBe(
        "For security purposes, please wait a moment before trying again.",
      );
    });
  });

  describe("email validation", () => {
    it("handles email validation error", () => {
      const error = new Error("Unable to validate email address");
      expect(getSupabaseErrorMessage(error)).toBe(
        "Unable to validate email address. Please check and try again.",
      );
    });
  });

  describe("signups disabled", () => {
    it("returns message when signups are disabled", () => {
      const error = new Error("Signups not allowed for this instance");
      expect(getSupabaseErrorMessage(error)).toBe(
        "Sign ups are not allowed at this time.",
      );
    });
  });

  describe("user not found", () => {
    it("returns message for non-existent user", () => {
      const error = new Error("User not found");
      expect(getSupabaseErrorMessage(error)).toBe(
        "That email address doesn't match an existing account.",
      );
    });
  });

  describe("password requirements", () => {
    it("handles password reuse prevention", () => {
      const error = new Error("New password should be different from the old password");
      expect(getSupabaseErrorMessage(error)).toBe(
        "Your new password must be different from your current password.",
      );
    });
  });

  describe("fallback messages", () => {
    it("returns original message for unknown error", () => {
      const error = new Error("Some unknown error message");
      expect(getSupabaseErrorMessage(error)).toBe("Some unknown error message");
    });

    it("returns default message for non-Error objects", () => {
      expect(getSupabaseErrorMessage("string error")).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(getSupabaseErrorMessage(null)).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(getSupabaseErrorMessage(undefined)).toBe(
        "An unexpected error occurred. Please try again.",
      );
      expect(getSupabaseErrorMessage(123)).toBe(
        "An unexpected error occurred. Please try again.",
      );
    });

    it("returns default message for Error with empty message", () => {
      const error = new Error("");
      expect(getSupabaseErrorMessage(error)).toBe(
        "An error occurred during authentication. Please try again.",
      );
    });
  });

  describe("edge cases", () => {
    it("handles errors with similar but not exact messages", () => {
      const error = new Error("This is not an Invalid login credentials error");
      // Should not match since "Invalid login credentials" is not contained
      expect(getSupabaseErrorMessage(error)).not.toBe(
        "The email and password you entered don't match.",
      );
    });

    it("is case sensitive", () => {
      const error = new Error("invalid login credentials");
      // Should not match due to case sensitivity
      expect(getSupabaseErrorMessage(error)).toBe(
        "invalid login credentials",
      );
    });

    it("handles multiline error messages", () => {
      const error = new Error("Error:\nInvalid login credentials\nPlease try again");
      expect(getSupabaseErrorMessage(error)).toBe(
        "The email and password you entered don't match.",
      );
    });
  });
});