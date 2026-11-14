import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In | Tinat",
  description: "Sign in to your Tinat health research account.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
