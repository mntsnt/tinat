"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { ImageUploadField } from "../../../components/ui/ImageUploadField";

type EditableQuestion = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  imageUrl?: string | null;
  imageAspect?: "16:9" | "1:1" | "4:3" | "3:4";
  options: Array<{ text: string; imageUrl?: string | null }>;
};

export default function EditFormPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageAspect, setCoverImageAspect] = useState<"16:9" | "1:1" | "4:3" | "3:4">("16:9");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/forms/${params.id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load form.");
        setLoading(false);
        return;
      }
      const form = data.form;
      setTitle(form.title || "");
      setDescription(form.description || "");
      setCoverImageUrl(form.coverImageUrl || null);
      setCoverImageAspect(form.coverImageAspect || "16:9");
      setQuestions((form.questions || []).map((question: any) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        required: question.required,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        scaleMinLabel: question.scaleMinLabel,
        scaleMaxLabel: question.scaleMaxLabel,
        imageUrl: question.imageUrl,
        imageAspect: question.imageAspect || "4:3",
        options: (question.options || []).map((option: any) => ({ text: option.text, imageUrl: option.imageUrl })),
      })));
      setLoading(false);
    }
    void load();
  }, [params.id]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (!title.trim()) throw new Error("Form title is required.");
      if (questions.some((question) => !question.text.trim())) throw new Error("Every question requires text.");
      const response = await fetch(`/api/forms/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          coverImageUrl,
          coverImageAspect,
          questions: questions.map((question) => ({
            text: question.text,
            type: question.type,
            required: question.required,
            scaleMin: question.scaleMin,
            scaleMax: question.scaleMax,
            scaleMinLabel: question.scaleMinLabel,
            scaleMaxLabel: question.scaleMaxLabel,
            imageUrl: question.imageUrl,
            imageAspect: question.imageAspect,
            options: question.options.map((option) => option.text),
            optionImages: question.options.map((option) => option.imageUrl || ""),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save form.");
      router.push(`/forms/${params.id}/responses`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="px-4 py-20 text-center text-muted-foreground">Loading form editor...</div>;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <ButtonLink href={`/forms/${params.id}/responses`} variant="ghost" className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to responses
      </ButtonLink>
      <Card>
        <CardHeader><CardTitle>Edit form</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {error && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Form title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Description</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <ImageUploadField
            label="Form cover image"
            value={coverImageUrl}
            aspect={coverImageAspect}
            onChange={(value, aspect) => { setCoverImageUrl(value); setCoverImageAspect(aspect); }}
          />
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border border-border p-4">
                <p className="mb-2 text-xs font-bold text-primary">QUESTION {index + 1}</p>
                <input value={question.text} onChange={(event) => setQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, text: event.target.value } : item))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select value={question.type} onChange={(event) => setQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, type: event.target.value } : item))} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                    {["SHORT_TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "LINEAR_SCALE", "YES_NO", "DATE", "NUMBER"].map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={question.required} onChange={(event) => setQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, required: event.target.checked } : item))} /> Required</label>
                </div>
                {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type) && (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <input
                        key={optionIndex}
                        value={option.text}
                        onChange={(event) => setQuestions((prev) => prev.map((item) => item.id === question.id ? { ...item, options: item.options.map((value, idx) => idx === optionIndex ? { ...value, text: event.target.value } : value) } : item))}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
