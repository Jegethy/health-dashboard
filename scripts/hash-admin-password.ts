import crypto from "crypto";
import readline from "readline";

const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};
const HASH_LENGTH = 64;

async function main() {
  const password = process.env.ADMIN_PASSWORD_FOR_HASH ?? (await promptHidden("Admin password: "));

  if (!password || password.length < 12) {
    console.error("Use an admin password with at least 12 characters.");
    process.exit(1);
  }

  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, HASH_LENGTH, SCRYPT_OPTIONS);
  const encoded = [
    "scrypt",
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");

  console.log("");
  console.log("Add this to .env.local:");
  console.log(`ADMIN_PASSWORD_HASH="${encoded}"`);
  console.log("");
  console.log("Also set ADMIN_SESSION_SECRET to a long random value.");
}

function promptHidden(prompt: string) {
  return new Promise<string>((resolve) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    let value = "";

    const onData = (char: string) => {
      if (char === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
        return;
      }

      if (char === "\u0008" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    process.stdin.on("data", onData);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not generate admin password hash.");
  process.exit(1);
});
