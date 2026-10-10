export const STUDY_BANNERS = [
  {
    id: "canopy",
    name: "Canopy",
    className: "bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600",
  },
  {
    id: "horizon",
    name: "Horizon",
    className: "bg-gradient-to-br from-rose-950 via-orange-800 to-amber-500",
  },
  {
    id: "tidal",
    name: "Tidal",
    className: "bg-gradient-to-br from-sky-950 via-blue-800 to-cyan-500",
  },
  {
    id: "bloom",
    name: "Bloom",
    className: "bg-gradient-to-br from-fuchsia-950 via-purple-800 to-pink-500",
  },
  {
    id: "mineral",
    name: "Mineral",
    className: "bg-gradient-to-br from-slate-950 via-slate-700 to-stone-500",
  },
  {
    id: "meadow",
    name: "Meadow",
    className: "bg-gradient-to-br from-lime-950 via-green-800 to-emerald-500",
  },
] as const;

export type StudyBannerTheme = (typeof STUDY_BANNERS)[number]["id"];

export function isStudyBannerTheme(value: unknown): value is StudyBannerTheme {
  return (
    typeof value === "string" &&
    STUDY_BANNERS.some((banner) => banner.id === value)
  );
}

export function getStudyBanner(theme: string | null | undefined) {
  return STUDY_BANNERS.find((banner) => banner.id === theme) ?? STUDY_BANNERS[0];
}
