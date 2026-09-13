"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout} 
      isLoading={loading}
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}