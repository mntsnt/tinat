import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Platform Agreement | Tinat",
  description: "Review Tinat's current Terms of Use and Privacy Notice.",
};

export default function AgreementLayout({ children }: { children: ReactNode }) {
  return children;
}
