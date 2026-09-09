type NavLink = { title: string; href: string; icon?: React.ReactNode };

export const publicLinks: NavLink[] = [
  { title: "Top Surveys", href: "/#top-surveys" },
  { title: "How it works", href: "/#how-it-works" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Trust", href: "/#trust" },
];

export const participantLinks: NavLink[] = [
  { title: "Dashboard", href: "/participant" },
  { title: "Discover", href: "/participant/studies" },
  { title: "History", href: "/participant/history" },
  { title: "Wallet", href: "/participant/wallet" },
];

export const researcherLinks: NavLink[] = [
  { title: "Dashboard", href: "/researcher" },
  { title: "Publish a Study", href: "/researcher/studies" },
  { title: "Create Study", href: "/researcher/studies/new" },
];

export const adminLinks: NavLink[] = [
  { title: "Overview", href: "/admin" },
  { title: "Users", href: "/admin/users" },
  { title: "Studies", href: "/admin/studies" },
  { title: "Withdrawals", href: "/admin/withdrawals" },
  { title: "Logs", href: "/admin/logs" },
];

export function getLinksForUser(user: { role?: string } | null): NavLink[] {
  if (!user) return publicLinks;
  const role = user.role?.toUpperCase();
  if (role === "PARTICIPANT") return participantLinks;
  if (role === "RESEARCHER") return researcherLinks;
  if (role === "ADMIN") return adminLinks;
  return publicLinks;
}
