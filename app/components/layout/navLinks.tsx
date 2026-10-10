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
  { title: "Tinat Ask", href: "/ask", icon: <BrainCircuit /> },
];

export const participantLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/participant", icon: <HeartPulse /> },
  { title: "Discover Studies", href: "/participant/studies", icon: <Microscope /> },
  { title: "History", href: "/participant/history", icon: <ClipboardClock /> },
  { title: "Wallet", href: "/participant/wallet", icon: <WalletCards /> },
  { title: "Tinat Ask", href: "/ask", icon: <BrainCircuit /> },
];

export const researcherLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/researcher", icon: <ChartNoAxesCombined /> },
  { title: "Research Projects", href: "/projects", icon: <Workflow /> },
  { title: "My Studies", href: "/researcher/studies", icon: <BookOpenCheck /> },
  { title: "Tinat Ask", href: "/ask", icon: <BrainCircuit /> },
];

export const adminLinks: SidebarLink[] = [
  { title: "Overview", href: "/admin", icon: <Radar /> },
  { title: "Admin Community", href: "/admin/community", icon: <MessageCircleMore /> },
  { title: "User Management", href: "/admin/users", icon: <ShieldUser /> },
  { title: "Manage Studies", href: "/admin/studies", icon: <ScanSearch /> },
  { title: "Tinat Ask", href: "/ask", icon: <BrainCircuit /> },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: <HandCoins /> },
  { title: "Activity Logs", href: "/admin/logs", icon: <ScrollText /> },
];

export function getLinksForUser(user: { role?: string; isCollector?: boolean } | null): SidebarLink[] {
  if (!user) return publicLinks;
  
  const role = user.role?.toUpperCase();
  
  if (role === "PARTICIPANT") {
    const links = [...participantLinks];
    if (user.isCollector) {
      links.splice(links.length - 1, 0, { title: "Field Collection", href: "/collector/dashboard", icon: <ClipboardList /> });
    }
    return links;
  }
  
  if (role === "RESEARCHER") return researcherLinks;
  if (role === "ADMIN") return adminLinks;
  
  return publicLinks;
}
