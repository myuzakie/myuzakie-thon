import type { NavItem } from "@/configs/navConfig";

export const navItems: NavItem[] = [
  {
    groupLabel: "Workspace",
    items: [
      { icon: "LayoutDashboard", label: "Overview", href: "/dashboard" },
      { icon: "Trophy", label: "Hackathons", href: "/hackathons" },
      { icon: "FolderKanban", label: "Projects", href: "/projects" },
      { icon: "Lightbulb", label: "Ideas", href: "/ideas" },
    ],
  },
  {
    groupLabel: "Resources",
    items: [
      { icon: "PanelsTopLeft", label: "UI resources", href: "/resources" },
      { icon: "ListChecks", label: "Submission", href: "/submission" },
    ],
  },
  {
    groupLabel: "System",
    items: [{ icon: "Settings2", label: "Settings", href: "/settings" }],
  },
];
