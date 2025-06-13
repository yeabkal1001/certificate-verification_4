import type { Signature } from "@/types/template";

// Mock signatures API for frontend integration only
export const signaturesApi = {
  async uploadSignature(file: File): Promise<{ base64: string }> {
    // Simulate upload and return base64 string
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result as string });
      reader.readAsDataURL(file);
    });
  },
  async getSignature(id: string): Promise<{ base64: string }> {
    // Simulate fetching a signature
    return { base64: "" };
  },
  async getAll(): Promise<Signature[]> {
    // Simulate fetching all signatures
    return [];
  },
};
