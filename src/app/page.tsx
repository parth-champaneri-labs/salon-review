import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";

export default function Home() {
  redirect(siteConfig.reviewPath);
}
