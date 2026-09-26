type NavLink = { title: string; href: string; icon?: React.ReactNode };

export const publicLinks: NavLink[] = [
  { title: "Health Studies", href: "/participant/studies" },
  { title: "Tinat Ask", href: "/ask" },
  { title: "Pathways", href: "/#how-it-works" },
  { title: "About Tinat", href: "/#trust" },
];

export const participantLinks: NavLink[] = [
  { title: "Dashboard", href: "/participant" },
  { title: "Health Studies", href: "/participant/studies" },
  { title: "Research Projects", href: "/projects" },
  { title: "My History", href: "/participant/history" },
  { title: "TC Wallet", href: "/participant/wallet" },
  { title: "Tinat Ask", href: "/ask" },
];

export const researcherLinks: NavLink[] = [
  { title: "Dashboard", href: "/researcher" },
  { title: "AI Chat", href: "/ai" },
  { title: "Research Projects", href: "/projects" },
  { title: "Publish a Study", href: "/researcher/studies" },
  { title: "Create Study", href: "/researcher/studies/new" },
  { title: "Tinat Ask", href: "/ask" },
];

export const adminLinks: NavLink[] = [
  { title: "Overview", href: "/admin" },
  { title: "AI Chat", href: "/ai" },
  { title: "Research Projects", href: "/projects" },
  { title: "Users", href: "/admin/users" },
  { title: "Studies", href: "/admin/studies" },
  { title: "Tinat Ask", href: "/ask" },
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
