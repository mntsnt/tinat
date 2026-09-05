import Link from "next/link";
import { Button } from "./components/ui/Button";
import { ArrowRight, Sparkles, BookOpen, Wallet, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background px-4 py-24 md:py-32 lg:px-8 border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            The Next Generation Research Platform
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-7xl lg:leading-[1.1]">
            Advance human knowledge.
            <br className="hidden sm:inline" />{" "}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Get rewarded for your time.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Tinat is the premier platform connecting academic researchers with participants. 
            Contribute to cutting-edge studies and earn Tinat Credits (TC) that can be withdrawn to your account.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto group">
                Join as Participant
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Publish a Study
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Tinat Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A transparent, efficient ecosystem built for modern academic research.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-card-foreground">Discover</h3>
              <p className="text-muted-foreground leading-relaxed">
                Browse our repository of active academic studies. Filter by duration, topic, and reward to find the perfect fit.
              </p>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-card-foreground">Participate</h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete surveys, experiments, and interviews securely on our seamless platform.
              </p>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-card-foreground">Earn & Withdraw</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive Tinat Credits instantly upon completion. Withdraw directly to your local bank or mobile wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-background px-4 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-10">
          <h2 className="text-xl font-medium text-muted-foreground">
            Trusted by researchers at leading institutions
          </h2>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-60 grayscale transition-opacity hover:opacity-100">
            <span className="text-2xl font-bold font-serif tracking-tight">University of Science</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Global Institute</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Tech Academy</span>
            <span className="text-2xl font-bold font-serif tracking-tight">Medical Research Hub</span>
          </div>
        </div>
      </section>
    </div>
  );
}
