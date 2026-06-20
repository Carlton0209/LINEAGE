import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function InspectPage() {
  redirect("/verify?mode=files");
}
