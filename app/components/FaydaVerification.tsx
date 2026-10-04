"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { ShieldCheck, Camera, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";

type UIState = 
  | "IDLE" 
  | "PROCESSING_LOCAL" 
  | "VERIFYING_SERVER" 
  | "VERIFIED" 
  | "FAILED";

export function FaydaVerification({ isVerified, verifiedAt }: { isVerified: boolean, verifiedAt?: Date | null }) {
  const [uiState, setUiState] = useState<UIState>(isVerified ? "VERIFIED" : "IDLE");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Pre-load the WASM engine locally so we don't depend on CDN
    import("fayda-decoder").then((mod) => {
      mod.prepareQrEngine({
        overrides: {
          locateFile: () => "/zxing_reader.wasm",
        },
      });
    }).catch(console.error);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setUiState("PROCESSING_LOCAL");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // 1. Decode locally
      // We don't request the face image to respect privacy
      const { decodeImage } = await import("fayda-decoder");
      const result = await decodeImage(bytes, { includeFace: false });

      if (!result.ok) {
        throw new Error("NOT_FAYDA");
      }

      // 2. Send payload to server for signature verification and database storage
      setUiState("VERIFYING_SERVER");
      
      const res = await fetch("/api/auth/fayda-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: result.raw.payload })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Server verification failed");
      }

      setUiState("VERIFIED");
    } catch (err: any) {
      console.error(err);
      setUiState("FAILED");
      
      const msg = err.message || "";
      if (msg.includes("NO_QR_FOUND")) {
        setErrorMsg("We couldn't find the Fayda QR code. Make sure you're photographing the back of the card.");
      } else if (msg.includes("QR_UNREADABLE")) {
        setErrorMsg("The QR code couldn't be read. Try taking a clearer photo with better lighting.");
      } else if (msg.includes("NOT_FAYDA")) {
        setErrorMsg("This doesn't appear to contain a valid Fayda QR code.");
      } else if (msg.includes("UNSUPPORTED_VERSION")) {
        setErrorMsg("This Fayda card format isn't supported yet. Please contact support.");
      } else {
        setErrorMsg(msg || "The Fayda card could not be authenticated. Please try again with a clear photo of the original card.");
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (uiState === "VERIFIED") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Fayda Verified</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Card authenticity verified
              </p>
              {verifiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Verified on: {new Date(verifiedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Verify your identity using your Ethiopian Fayda National ID. Your card is processed securely on your device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uiState === "FAILED" && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive mb-1">Verification Failed</p>
              <p className="text-xs text-destructive/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {(uiState === "PROCESSING_LOCAL" || uiState === "VERIFYING_SERVER") ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-foreground">
              {uiState === "PROCESSING_LOCAL" ? "Reading card securely..." : "Verifying authenticity..."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-sm">
              Please wait while we process your card. This may take a few moments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-5 border border-dashed border-border text-center">
              <p className="text-sm font-medium text-foreground mb-4">
                Take a clear photo of the <strong>back</strong> of your Fayda ID card.
              </p>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full sm:w-auto gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Scan Card
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("capture");
                      fileInputRef.current.click();
                      // Re-add capture after short delay so mobile scan button stays "Scan"
                      setTimeout(() => fileInputRef.current?.setAttribute("capture", "environment"), 1000);
                    }
                  }} 
                  className="w-full sm:w-auto gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
