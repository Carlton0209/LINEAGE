import type { Metadata } from "next";
import AxionHomepage from "@/components/axion-homepage";

export const metadata: Metadata = {
  title: "LINEAGE",
  description: "Verifiable AI bills of materials for media delivery."
};

export default function HomePage() {
  return <AxionHomepage />;
}
