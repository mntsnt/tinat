import Link from "next/link";
import { Button } from "./components/ui/Button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white font-bold text-2xl shadow-md mb-6">
        T
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
        404 &bull; Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
        Lost in the research?
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        The page you are looking for might have been moved, renamed, or is no longer available on the Tinat platform.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/">
          <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full sm:w-auto gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
