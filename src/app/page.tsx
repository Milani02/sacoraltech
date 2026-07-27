import { redirect } from "next/navigation";

export default function Home() {
  // Fase 1: redireciona conforme a sessão. Por ora, vai para o dashboard.
  redirect("/dashboard");
}
