import React from "react";
import {
  LayoutDashboard,
  Compass,
  History,
  Wallet,
  Settings,
  MessageCircleQuestion,
  ClipboardList,
  FolderKanban,
  FolderOpen,
  Users,
  CreditCard,
  Activity,
  FileText
} from "lucide-react";
import { SidebarLink } from "./Sidebar";

export const publicLinks: SidebarLink[] = [
  { title: "Health Studies", href: "/participant/studies", icon: <Compass /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleQuestion /> },
];

export const participantLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/participant", icon: <LayoutDashboard /> },
  { title: "Discover Studies", href: "/participant/studies", icon: <Compass /> },
  { title: "History", href: "/participant/history", icon: <History /> },
  { title: "Wallet", href: "/participant/wallet", icon: <Wallet /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleQuestion /> },
  { title: "Settings", href: "/participant/settings", icon: <Settings /> },
];

export const researcherLinks: SidebarLink[] = [
  { title: "Dashboard", href: "/researcher", icon: <LayoutDashboard /> },
  { title: "Research Projects", href: "/projects", icon: <FolderKanban /> },
  { title: "My Studies", href: "/researcher/studies", icon: <FolderOpen /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleQuestion /> },
  { title: "Settings", href: "/researcher/settings", icon: <Settings /> },
];

export const adminLinks: SidebarLink[] = [
  { title: "Overview", href: "/admin", icon: <LayoutDashboard /> },
  { title: "User Management", href: "/admin/users", icon: <Users /> },
  { title: "Manage Studies", href: "/admin/studies", icon: <FileText /> },
  { title: "Tinat Ask", href: "/ask", icon: <MessageCircleQuestion /> },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: <CreditCard /> },
  { title: "Activity Logs", href: "/admin/logs", icon: <Activity /> },
  { title: "Settings", href: "/admin/settings", icon: <Settings /> },
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
