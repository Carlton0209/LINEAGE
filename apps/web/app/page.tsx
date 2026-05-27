import type { Metadata } from "next";
import AxionHomepage from "@/components/axion-homepage";

export const metadata: Metadata = {
  title: "Axion Studio",
  description: "A strategy-led design agency landing page with animated shader motion."
};

export default function HomePage() {
  return <AxionHomepage />;
}
