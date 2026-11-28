import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function AcademyMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-p:my-3 prose-p:leading-7 prose-li:leading-7 prose-a:text-primary prose-a:underline-offset-4 prose-strong:text-foreground prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, title }) => (
            <figure className="my-6 block not-prose">
              <div className="overflow-hidden rounded-xl border border-border bg-card p-2 sm:p-4 shadow-xs">
                <img
                  src={src}
                  alt={alt || "Tinat Academy illustration"}
                  className="mx-auto block h-auto max-h-[580px] w-full max-w-full rounded-lg object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {(title || alt) && (
                <figcaption className="mt-2 text-center text-xs font-medium text-muted-foreground">
                  {title || alt}
                </figcaption>
              )}
            </figure>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
