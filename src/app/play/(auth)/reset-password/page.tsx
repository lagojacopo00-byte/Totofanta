import { Brandbar } from "@/components/brandbar";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 pt-16 pb-24">
      <Brandbar subtitle="Nuova password" center />
      <ResetPasswordForm />
    </main>
  );
}
