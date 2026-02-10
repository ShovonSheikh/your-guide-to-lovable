import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useSupabase } from "@/hooks/useSupabase";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TopNavbar } from "@/components/TopNavbar";
import { MainFooter } from "@/components/MainFooter";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  History,
} from "lucide-react";
import { format } from "date-fns";

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  deposit: { label: "Deposit", color: "text-green-600 bg-green-100", icon: ArrowDownLeft },
  tip_sent: { label: "Tip Sent", color: "text-red-600 bg-red-100", icon: ArrowUpRight },
  tip_received: { label: "Tip Received", color: "text-green-600 bg-green-100", icon: ArrowDownLeft },
  withdrawal: { label: "Withdrawal", color: "text-orange-600 bg-orange-100", icon: ArrowUpRight },
  refund: { label: "Refund", color: "text-blue-600 bg-blue-100", icon: ArrowDownLeft },
};

export default function Transactions() {
  usePageTitle("Transaction History");
  const { isSignedIn, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { balance } = useTokenBalance();
  const supabase = useSupabase();

  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from("token_transactions")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) setTransactions(data);
      setLoading(false);
    }
    fetch();
  }, [profile?.id, supabase]);

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <div className="h-24" />
        <main className="container max-w-2xl py-8 px-4">
          <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />
        </main>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      <div className="h-24" />

      <main className="container max-w-2xl py-8 px-4 flex-1 animate-fade-in">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Balance Summary */}
        <div className="tipkoro-card mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Token Balance</p>
            <p className="text-2xl font-display font-bold">৳{balance.toLocaleString()}</p>
          </div>
          <Link to="/deposit">
            <button className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-tipkoro-gold-hover transition-colors flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Buy Tokens
            </button>
          </Link>
        </div>

        {/* Transaction List */}
        <div className="tipkoro-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Deposit tokens to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => {
                const config = typeConfig[txn.type] || typeConfig.deposit;
                const Icon = config.icon;
                return (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {txn.description || format(new Date(txn.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {txn.amount >= 0 ? "+" : ""}৳{Math.abs(txn.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bal: ৳{txn.balance_after.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
