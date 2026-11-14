import { verifySignature } from "fayda-decoder/verify";

export async function verifyFaydaSignature(
  result: Parameters<typeof verifySignature>[0]
): Promise<void> {
  const verification = await verifySignature(result);
  if (!verification.verified) {
    throw new Error("Fayda signature verification failed");
  }
}
