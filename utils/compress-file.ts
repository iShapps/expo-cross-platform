import { File } from "expo-file-system";

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024; // 2MB

export class FileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileTooLargeError";
  }
}

// Rejects any picked file over the 2MB upload limit.
export async function ensureWithinUploadLimit<T extends { uri: string }>(
  file: T,
): Promise<T> {
  const size = new File(file.uri).size;
  if (size > MAX_DOCUMENT_BYTES) {
    throw new FileTooLargeError(
      "This file is larger than 2MB. Please choose a smaller file.",
    );
  }

  return file;
}
