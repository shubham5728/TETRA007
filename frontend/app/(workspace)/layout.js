import AppShell from "@/components/AppShell";

// Every signed-in route sits inside the sidebar + header chrome.
export default function WorkspaceLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
