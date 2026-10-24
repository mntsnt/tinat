import React from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  ClipboardList,
  ClipboardClock,
  HandCoins,
  HeartPulse,
  MessageCircleMore,
  Microscope,
  Radar,
  ScanSearch,
  ScrollText,
  ShieldUser,
  WalletCards,
  Workflow,
} from "lucide-react";
import { SidebarLink } from "./Sidebar";

export const publicLinks: SidebarLink[] = [
  { title: "Health Studies", href: "/participant/studies", icon: <Microscope /> },
];

export const participantLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/participant", icon: <HeartPulse /> },
  { title: "Tinat Forms", href: "/forms", icon: <ClipboardList /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleMore /> },
  { title: "Discover Studies", href: "/participant/studies", icon: <Microscope /> },
  { title: "History", href: "/participant/history", icon: <ClipboardClock /> },
  { title: "Wallet", href: "/participant/wallet", icon: <WalletCards /> },
];

export const researcherLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/researcher", icon: <ChartNoAxesCombined /> },
  { title: "Tinat Forms", href: "/forms", icon: <ClipboardList /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleMore /> },
  { title: "My Studies", href: "/researcher/studies", icon: <BookOpenCheck /> },
  { title: "Research Projects", href: "/projects", icon: <Workflow /> },
];

export const adminLinks: SidebarLink[] = [
  { title: "Overview", href: "/admin", icon: <Radar /> },
  { title: "Tinat Forms", href: "/forms", icon: <ClipboardList /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleMore /> },
  { title: "Manage Studies", href: "/admin/studies", icon: <ScanSearch /> },
  { title: "User Management", href: "/admin/users", icon: <ShieldUser /> },
  { title: "Admin Community", href: "/admin/community", icon: <MessageCircleMore /> },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: <HandCoins /> },
  { title: "Activity Logs", href: "/admin/logs", icon: <ScrollText /> },
];

export function getLinksForUser(user: { role?: string; isCollector?: boolean } | null): SidebarLink[] {
  if (!user) return publicLinks;
  
  const role = user.role?.toUpperCase();
  
  if (role === "PARTICIPANT") {
    const links = [...participantLinks];
    if (user.isCollector) {
      links.splice(links.length - 2, 0, { title: "Field Collection", href: "/collector/dashboard", icon: <ClipboardList /> });
    }
    return links;
  }
  
  if (role === "RESEARCHER") return researcherLinks;
  if (role === "ADMIN") return adminLinks;
  
  return publicLinks;
}
