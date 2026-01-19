import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Bell, DollarSign, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminSettings() {
  usePageTitle("Admin - Settings");
  
  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Platform settings have been updated",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>

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
                <Label htmlFor="monthlyFee">Creator Account Fee (৳)</Label>
                <Input id="monthlyFee" type="number" defaultValue="150" />
                <p className="text-xs text-muted-foreground">Monthly fee for creator accounts</p>
              </div>
              <div className="space-y-2 opacity-50">
                <Label>Tip Fee</Label>
                <p className="text-lg font-medium text-green-600">0% (Free)</p>
                <p className="text-xs text-muted-foreground">No fee on tips - creators keep 100%</p>
              </div>
            </div>
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
                <Input id="minWithdraw" type="number" defaultValue="500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWithdraw">Maximum Withdrawal (৳)</Label>
                <Input id="maxWithdraw" type="number" defaultValue="50000" />
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
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
