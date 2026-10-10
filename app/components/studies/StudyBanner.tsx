import { getStudyBanner } from "../../../lib/studyBanners";

export function StudyBanner({
  theme,
  className = "",
}: {
  theme: string | null | undefined;
  className?: string;
}) {
  const banner = getStudyBanner(theme);

  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden ${banner.className} ${className}`}
    >
      <div className="absolute -right-8 -top-20 h-48 w-48 rounded-full border border-white/15" />
      <div className="absolute -right-1 -top-12 h-32 w-32 rounded-full border border-white/15" />
      <div className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent" />
    </div>
  );
}
