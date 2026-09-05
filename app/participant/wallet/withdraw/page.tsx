import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import WithdrawalForm from "./WithdrawalForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button, getButtonClasses } from "../../../components/ui/Button";
import Link from "next/link";

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
          &larr; Back to Wallet
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Withdraw Tinat Credits</CardTitle>
          <CardDescription>
            Convert your earned credits to real money via Telebirr or Bank Transfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WithdrawalForm balance={balance} />
        </CardContent>
      </Card>
    </div>
  );
}
