"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { useConfirm } from "./ui/ConfirmDialog";

interface StudyDeleteButtonProps {
  studyId: string;
  studyTitle: string;
  redirectAfterDelete?: string;
  variant?: "icon" | "button";
}

export function StudyDeleteButton({
  studyId,
  studyTitle,
  redirectAfterDelete,
  variant = "icon",
}: StudyDeleteButtonProps) {
  const router = useRouter();
  const { confirm, alert } = useConfirm();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const ok = await confirm({
      title: "Delete Research Study",
      message: `Are you sure you want to delete "${studyTitle}" and all its questions and collected responses? This action is permanent and cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Study",
    });

    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/studies/${studyId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        await alert({
          title: "Delete Failed",
          message: data.error || "Could not delete the study. Please try again.",
          variant: "danger",
        });
        return;
      }

      if (redirectAfterDelete) {
        router.push(redirectAfterDelete);
      } else {
        router.refresh();
      }
    } catch {
      await alert({
        title: "Connection Error",
        message: "Failed to connect to the server. Please try again.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        isLoading={loading}
        className="gap-1.5"
      >
        <Trash2 className="w-4 h-4" />
        Delete Study
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label={`Delete study ${studyTitle}`}
      title="Delete study"
      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
