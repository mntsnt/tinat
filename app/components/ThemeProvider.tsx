"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const orig = console.error;
      console.error = (...args: any[]) => {
        if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
          return;
        }
        orig.apply(console, args);
      };
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
