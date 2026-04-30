import crypto from "crypto";

const algorithm = "aes-256-gcm";

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptToken(encryptedToken: string): string {
  const [iv, tag, encrypted] = encryptedToken.split(".").map((part) => Buffer.from(part, "base64url"));

  if (!iv || !tag || !encrypted) {
    throw new Error("Stored integration token is not in a readable encrypted format.");
  }

  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function getKey() {
  const encryptionKey = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim();

  if (!encryptionKey) {
    throw new Error("INTEGRATION_TOKEN_ENCRYPTION_KEY is missing.");
  }

  return crypto.createHash("sha256").update(encryptionKey).digest();
}
