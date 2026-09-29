import { test, describe } from 'node:test';
import assert from 'node:assert';
import { decodePayload } from 'fayda-decoder';
import { verifySignature, VerifyOptions, FAYDA_V4_PUBLIC_KEY_PEM } from 'fayda-decoder/verify';

// We use the library's recommended synthetic payloads instead of real user data.
// Since we don't have a generated synthetic card image, we will test the payload parsing and signature verification directly.
// A mock synthetic V4 payload (this format matches the library's expectations, but will fail signature verification without a matching key).

const syntheticFaydaPayload = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==:DLT:Abebe Bikila:V:4:G:M:A:1234567890:D:1980/01/01:SIGN:eyJhbGciOiJSUzI1NiJ9.synthetic-signature-bytes";

describe("Fayda Decoder & Verification", () => {
  test("Decodes a valid synthetic Fayda QR payload", () => {
    const result = decodePayload(syntheticFaydaPayload);
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.strictEqual(result.fields.fan, "1234567890");
      assert.strictEqual(result.fields.full_name, "Abebe Bikila");
      assert.strictEqual(result.fields.gender, "M");
      assert.strictEqual(result.payload_version, "4");
    }
  });

  test("Fails to decode non-Fayda QR payload", () => {
    const result = decodePayload("https://example.com");
    assert.strictEqual(result.ok, false);
  });

  test("Fails to decode unsupported version", () => {
    const unsupportedPayload = "face:DLT:Abebe:V:5:G:M:A:123:D:1980/01/01:SIGN:sig";
    const result = decodePayload(unsupportedPayload);
    assert.strictEqual(result.ok, false);
  });

  test("Catches invalid/tampered signature using verifySignature", async () => {
    const result = decodePayload(syntheticFaydaPayload);
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      const verification = await verifySignature(result);
      assert.strictEqual(verification.verified, false);
      assert.strictEqual(verification.reason, "INVALID_SIGNATURE");
    }
  });

  test("Fails verification if signature is completely missing", async () => {
    const missingSigPayload = "data:image/webp;base64,face:DLT:Abebe:V:4:G:M:A:123:D:1980/01/01";
    const result = decodePayload(missingSigPayload);
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      const verification = await verifySignature(result);
      assert.strictEqual(verification.verified, false);
      assert.strictEqual(verification.reason, "SIGNATURE_MISSING");
    }
  });
});

