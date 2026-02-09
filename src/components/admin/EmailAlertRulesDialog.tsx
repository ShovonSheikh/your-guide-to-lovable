import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Mail,
  FileText,
  AlignLeft,
  Search,
} from "lucide-react";
import { useSupabaseWithAuth } from "@/hooks/useSupabaseWithAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface AlertRule {
  id: string;
  profile_id: string;
  name: string;
  match_type: "from_address" | "subject" | "body" | "any";
  match_value: string;
  match_mode: "exact" | "contains";
  is_active: boolean;
  created_at: string;
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  from_address: "Sender Email",
  subject: "Subject",
  body: "Body Content",
  any: "Any Field",
};

const MATCH_TYPE_ICONS: Record<string, typeof Mail> = {
  from_address: Mail,
  subject: FileText,
  body: AlignLeft,
  any: Search,
};

interface EmailAlertRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailAlertRulesDialog({ open, onOpenChange }: EmailAlertRulesDialogProps) {
  const supabase = useSupabaseWithAuth();
  const { profile } = useProfile();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe } = usePushNotifications();

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [matchType, setMatchType] = useState<string>("from_address");
  const [matchMode, setMatchMode] = useState<string>("contains");
  const [matchValue, setMatchValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from("email_alert_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRules((data as AlertRule[]) || []);
    } catch (err) {
      console.error("Error fetching alert rules:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile?.id]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchRules();
    }
  }, [open, fetchRules]);

  const handleAddRule = async () => {
    if (!profile?.id || !name.trim() || !matchValue.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("email_alert_rules").insert({
        profile_id: profile.id,
        name: name.trim(),
        match_type: matchType,
        match_value: matchValue.trim(),
        match_mode: matchMode,
      });

      if (error) throw error;

      toast.success("Alert rule created");
      setName("");
      setMatchValue("");
      setMatchType("from_address");
      setMatchMode("contains");
      setShowAddForm(false);
      fetchRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to create rule");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    try {
      const { error } = await supabase
        .from("email_alert_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;

      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch (err: any) {
      toast.error("Failed to toggle rule");
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("email_alert_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Rule deleted");
    } catch (err: any) {
      toast.error("Failed to delete rule");
    }
  };

  const handleEnablePush = async () => {
    await subscribe();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Alert Rules
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 gap-4 mt-4">
          {/* Push notification status */}
          {!pushLoading && isSupported && !isSubscribed && (
            <div className="rounded-lg border border-dashed border-accent bg-accent/10 p-3">
              <div className="flex items-start gap-3">
                <BellOff className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Push notifications not enabled</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable push notifications to receive browser alerts when emails match your rules.
                  </p>
                  <Button size="sm" onClick={handleEnablePush} className="mt-2">
                    Enable Push Notifications
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!pushLoading && !isSupported && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                Push notifications are not supported in this browser.
              </p>
            </div>
          )}

          {/* Add rule button / form */}
          {!showAddForm ? (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Alert Rule
            </Button>
          ) : (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="e.g. Payment alerts"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Match Type</Label>
                  <Select value={matchType} onValueChange={setMatchType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from_address">Sender Email</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="body">Body Content</SelectItem>
                      <SelectItem value="any">Any Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Match Mode</Label>
                  <Select value={matchMode} onValueChange={setMatchMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exact">Exact Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="match-value">Match Value</Label>
                <Input
                  id="match-value"
                  placeholder="e.g. payments@rupantor.com"
                  value={matchValue}
                  onChange={(e) => setMatchValue(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddRule} disabled={saving} className="flex-1">
                  {saving ? <Spinner className="h-4 w-4" /> : "Save Rule"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setName("");
                    setMatchValue("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Rules list */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No alert rules yet</p>
                <p className="text-xs mt-1">
                  Create a rule to get push notifications for specific emails
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const Icon = MATCH_TYPE_ICONS[rule.match_type] || Search;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rule.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {MATCH_TYPE_LABELS[rule.match_type]}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {rule.match_mode}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {rule.match_value}
                        </p>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive flex-shrink-0"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
