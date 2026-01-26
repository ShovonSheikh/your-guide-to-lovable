import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Plus, Trash2, Loader2, UserPlus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import { useMaintenanceWhitelist } from "@/hooks/useMaintenanceWhitelist";
import { toast } from "@/hooks/use-toast";

export default function MaintenanceSettings() {
  const { config, updateConfig } = usePlatformConfig();
  const { whitelist, loading: whitelistLoading, addToWhitelist, removeFromWhitelist } = useMaintenanceWhitelist();
  
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (config) {
      const modeConfig = config as unknown as { maintenance_mode?: { enabled: boolean }; maintenance_message?: { message: string } };
      setMaintenanceEnabled(modeConfig.maintenance_mode?.enabled || false);
      setMaintenanceMessage(modeConfig.maintenance_message?.message || "We are currently performing scheduled maintenance. Please check back soon!");
    }
  }, [config]);

  const handleSaveMaintenanceSettings = async () => {
    setSaving(true);
    try {
      await updateConfig('maintenance_mode', { enabled: maintenanceEnabled });
      await updateConfig('maintenance_message', { message: maintenanceMessage });
      toast({
        title: "Settings saved",
        description: maintenanceEnabled 
          ? "Maintenance mode is now active" 
          : "Maintenance mode has been disabled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save maintenance settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      });
      return;
    }

    setAddingUser(true);
    const result = await addToWhitelist(newUserId.trim(), newReason.trim() || undefined);
    setAddingUser(false);

    if (result.success) {
      setNewUserId("");
      setNewReason("");
      setAddDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (id: string) => {
    await removeFromWhitelist(id);
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Toggle */}
      <Card className={maintenanceEnabled ? "border-amber-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${maintenanceEnabled ? "text-amber-500" : ""}`} />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            When enabled, regular users will see a maintenance page and cannot access the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {maintenanceEnabled && (
            <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maintenance mode is currently <strong>ACTIVE</strong>. Regular users cannot access the site.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Block all non-whitelisted users from accessing the site
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={maintenanceEnabled}
              onCheckedChange={setMaintenanceEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
            <Textarea
              id="maintenanceMessage"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Enter the message to display during maintenance..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This message will be shown to users when they visit the site during maintenance
            </p>
          </div>

          <Button onClick={handleSaveMaintenanceSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Maintenance Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Whitelist Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Maintenance Whitelist
              </CardTitle>
              <CardDescription>
                Users who can access the site during maintenance (admins are automatically whitelisted)
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add User to Whitelist</DialogTitle>
                  <DialogDescription>
                    Enter the Clerk user ID of the user you want to whitelist
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">Clerk User ID</Label>
                    <Input
                      id="userId"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      placeholder="user_xxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can find this in the Users section of the admin panel
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Input
                      id="reason"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      placeholder="e.g., Developer, QA tester..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={addingUser}>
                    {addingUser ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Whitelist
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelistLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : whitelist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users whitelisted. Admins are automatically whitelisted.
                    </TableCell>
                  </TableRow>
                ) : (
                  whitelist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.profile ? (
                          <div>
                            <p className="font-medium">
                              {entry.profile.first_name} {entry.profile.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.profile.email || entry.profile.username || 'No email'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown user</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {entry.user_id.slice(0, 20)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {entry.reason || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveUser(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Note:</strong> All admin users automatically bypass maintenance mode regardless of whether they appear in this list.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
