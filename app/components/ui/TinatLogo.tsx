import Image from "next/image";
import { cn } from "@/lib/utils";

export interface TinatLogoProps {
  size?: number;
  className?: string;
  variant?: "color" | "adaptive" | "horizontal";
  showText?: boolean;
}

/**
 * Responsive, high-contrast Tinat brand logo component.
 * Automatically adapts between light and dark mode with zero layout shift.
 */
export function TinatLogo({
  size = 28,
  className,
  variant = "color",
  showText = false,
}: TinatLogoProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Image
          src="/tinat-logo-horizontal.png"
          alt="Tinat Research Ecosystem"
          width={Math.round(size * 3.34)}
          height={size}
          className="h-auto w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        {variant === "color" && (
          <Image
            src="/logo.png"
            alt="Tinat Logo"
            width={size}
            height={size}
            className="h-full w-full object-contain"
            priority
          />
        )}
        {variant === "adaptive" && (
          <>
            <Image
              src="/logo_black_transparent.png"
              alt="Tinat Logo"
              width={size}
              height={size}
              className="h-full w-full object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo_white_transparent.png"
              alt="Tinat Logo"
              width={size}
              height={size}
              className="hidden h-full w-full object-contain dark:block"
              priority
            />
          </>
        )}
      </div>
      {showText && (
        <span className="font-bold tracking-tight text-foreground text-base leading-none">
          Tinat
        </span>
      )}
    </div>
  );
}
