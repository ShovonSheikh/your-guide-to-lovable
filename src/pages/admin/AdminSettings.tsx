import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, DollarSign, Shield, Gift, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import MaintenanceSettings from "@/components/admin/MaintenanceSettings";

export default function AdminSettings() {
  usePageTitle("Admin - Settings");
  const { config, loading, updateConfig } = usePlatformConfig();
  
  const [creatorFee, setCreatorFee] = useState(150);
  const [minWithdraw, setMinWithdraw] = useState(100);
  const [maxWithdraw, setMaxWithdraw] = useState(50000);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoDuration, setPromoDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setCreatorFee(config.creator_account_fee?.amount || 150);
      setMinWithdraw(config.min_withdrawal?.amount || 100);
      setMaxWithdraw(config.max_withdrawal?.amount || 50000);
      setPromoEnabled(config.promo_enabled?.enabled || false);
      setPromoDuration(config.promo_duration_months?.months || 0);
    }
  }, [config]);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig('creator_account_fee', { amount: creatorFee, currency: 'BDT' });
      await updateConfig('min_withdrawal', { amount: minWithdraw, currency: 'BDT' });
      await updateConfig('max_withdrawal', { amount: maxWithdraw, currency: 'BDT' });
      await updateConfig('promo_enabled', { enabled: promoEnabled });
      await updateConfig('promo_duration_months', { months: promoDuration });
      
      toast({
        title: "Settings saved",
        description: "Platform settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

      {/* Maintenance Mode Section */}
      <MaintenanceSettings />

      <div className="grid gap-6">
        {/* Platform Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Platform Fees
            </CardTitle>
            <CardDescription>Configure platform fee structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyFee">Creator Fee (৳)</Label>
                <Input 
                  id="monthlyFee" 
                  type="number" 
                  value={creatorFee}
                  onChange={(e) => setCreatorFee(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Monthly flat fee for creators</p>
              </div>
              <div className="space-y-2 opacity-50">
                <Label>Tip Fee</Label>
                <p className="text-lg font-medium text-green-600">0% (Free)</p>
                <p className="text-xs text-muted-foreground">No fee on tips - creators keep 100%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Period Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Promo Period
            </CardTitle>
            <CardDescription>Configure promotional period for new creators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promoEnabled">Enable Promo Period</Label>
                <p className="text-xs text-muted-foreground">New creators get free access for a limited time</p>
              </div>
              <Switch
                id="promoEnabled"
                checked={promoEnabled}
                onCheckedChange={setPromoEnabled}
              />
            </div>
            {promoEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="promoDuration">Promo Duration (months)</Label>
                <Input 
                  id="promoDuration" 
                  type="number" 
                  value={promoDuration}
                  onChange={(e) => setPromoDuration(Number(e.target.value))}
                  min={0}
                  max={12}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Number of months new creators get free access (0 = no promo)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Withdrawal Settings
            </CardTitle>
            <CardDescription>Configure withdrawal limits and options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minWithdraw">Minimum Withdrawal (৳)</Label>
                <Input 
                  id="minWithdraw" 
                  type="number" 
                  value={minWithdraw}
                  onChange={(e) => setMinWithdraw(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWithdraw">Maximum Withdrawal (৳)</Label>
                <Input 
                  id="maxWithdraw" 
                  type="number" 
                  value={maxWithdraw}
                  onChange={(e) => setMaxWithdraw(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available Payout Methods</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="bg-green-50">bKash</Button>
                <Button variant="outline" size="sm" className="bg-orange-50">Nagad</Button>
                <Button variant="outline" size="sm" className="bg-purple-50">Rocket</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure push notification defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Push notifications are enabled for all users by default. Users can customize their preferences in their settings.
            </p>
            <div className="space-y-2">
              <Label>Default Notification Types</Label>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Tip received notifications</li>
                <li>• Withdrawal status updates</li>
                <li>• Subscription reminders</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Platform security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authentication is managed through Clerk. Visit the Clerk dashboard for security configuration.
            </p>
            <Button variant="outline" onClick={() => window.open('https://dashboard.clerk.com', '_blank')}>
              Open Clerk Dashboard
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}