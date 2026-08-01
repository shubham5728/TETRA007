import { redirect } from "next/navigation";

// Entry point: everyone signs in before reaching a workspace.
export default function Home() {
  redirect("/login");
}
