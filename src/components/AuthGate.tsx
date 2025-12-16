"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  children: React.ReactNode;
  requireHandle?: boolean;
};

export default function AuthGate({ children, requireHandle = true }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      if (requireHandle) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, handle")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error(error);
        }

        if (!profile?.handle) {
          router.replace("/profile");
          return;
        }
      }

      if (alive) setOk(true);
    }

    run();

    return () => {
      alive = false;
    };
  }, [router, requireHandle]);

  if (!ok) {
    return (
      <div className="p-6 text-sm opacity-80">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
