import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button, getButtonClasses } from "../../../components/ui/Button";
import Link from "next/link";
import { CREDITS_DISCLAIMER, formatCredits } from "@/lib/config/features";
import { AlertCircle, ArrowLeft, Coins, ShieldAlert } from "lucide-react";

export default async function WithdrawPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { wallet: true },
  });

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  const balance = user.wallet?.balance ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-2xl">
      <div className="mb-6">
        <Link href="/participant/wallet" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Link>
      </div>

      <Card className="border-border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <Coins className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Credit System Information</CardTitle>
          <CardDescription className="text-sm mt-1">
            Participant Rewards & Token Policy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4 text-center">
          <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start text-left gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-sm mb-0.5 text-foreground">
                Withdrawals Are Not Available
              </span>
              Tinat Credits are internal platform tokens awarded for research participation. Credits cannot currently be withdrawn, exchanged for fiat money, or transferred between accounts.
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Your Current Balance
            </p>
            <p className="text-3xl font-extrabold text-foreground mt-1">
              {formatCredits(balance)}
            </p>
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span>{CREDITS_DISCLAIMER}</span>
          </div>

          <div className="pt-2">
            <Link href="/participant/wallet">
              <Button className="w-full">
                Return to My Wallet
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
