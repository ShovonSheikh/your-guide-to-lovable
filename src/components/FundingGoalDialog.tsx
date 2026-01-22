import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Pencil, Trash2, Calendar, Share2 } from "lucide-react";
import { FundingGoal, useFundingGoals } from "@/hooks/useFundingGoals";
import { FundingGoalCard } from "@/components/FundingGoalCard";
import { GoalShareCard } from "@/components/GoalShareCard";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FundingGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  username?: string;
  displayName?: string;
}

type ViewMode = "list" | "create" | "edit";

export function FundingGoalDialog({ open, onOpenChange, profileId, username, displayName }: FundingGoalDialogProps) {
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleGoalActive } = useFundingGoals(profileId);
  
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingGoal, setEditingGoal] = useState<FundingGoal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [shareGoal, setShareGoal] = useState<FundingGoal | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetAmount("");
    setEndDate("");
    setEditingGoal(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setViewMode("create");
  };

  const handleOpenEdit = (goal: FundingGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setTargetAmount(goal.target_amount.toString());
    setEndDate(goal.end_date ? format(new Date(goal.end_date), "yyyy-MM-dd") : "");
    setViewMode("edit");
  };

  const handleBack = () => {
    resetForm();
    setViewMode("list");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount) return;

    setSaving(true);

    if (viewMode === "create") {
      await createGoal({
        profile_id: profileId,
        title: title.trim(),
        description: description.trim() || undefined,
        target_amount: parseFloat(targetAmount),
        end_date: endDate || null,
      });
    } else if (viewMode === "edit" && editingGoal) {
      await updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim() || null,
        target_amount: parseFloat(targetAmount),
        end_date: endDate || null,
      });
    }

    setSaving(false);
    handleBack();
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteGoal(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  // Reset to list view when dialog closes
  useEffect(() => {
    if (!open) {
      setViewMode("list");
      resetForm();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {viewMode === "list" && "Funding Goals"}
              {viewMode === "create" && "Create Goal"}
              {viewMode === "edit" && "Edit Goal"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "list" && "Set goals to show progress on your profile"}
              {viewMode === "create" && "Create a new funding goal for your supporters"}
              {viewMode === "edit" && "Update your funding goal details"}
            </DialogDescription>
          </DialogHeader>

          {viewMode === "list" && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Button onClick={handleOpenCreate} className="gap-2 mb-4">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>

              <div className="flex-1 overflow-y-auto space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No funding goals yet</p>
                    <p className="text-sm text-muted-foreground/70">Create one to show on your profile!</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <Card key={goal.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{goal.title}</h4>
                            {goal.is_active ? (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {username && goal.is_active && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => setShareGoal(goal)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(goal)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>৳{goal.current_amount.toLocaleString()}</span>
                          <span className="text-muted-foreground">৳{goal.target_amount.toLocaleString()}</span>
                        </div>
                        <Progress value={(goal.current_amount / goal.target_amount) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={goal.is_active}
                            onCheckedChange={(checked) => toggleGoalActive(goal.id, checked)}
                          />
                          <span className="text-sm text-muted-foreground">
                            Show on profile
                          </span>
                        </div>
                        {goal.end_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(goal.end_date), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {(viewMode === "create" || viewMode === "edit") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., New Camera Equipment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What will you use this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (৳) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="10000"
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for ongoing goals
                </p>
              </div>

              {viewMode === "edit" && editingGoal && (
                <div className="space-y-2">
                  <Label>Current Progress</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      ৳{editingGoal.current_amount.toLocaleString()} raised ({Math.round((editingGoal.current_amount / editingGoal.target_amount) * 100)}%)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !title.trim() || !targetAmount} className="flex-1">
                  {saving ? "Saving..." : viewMode === "create" ? "Create Goal" : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Funding Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this funding goal and its progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Goal Share Card */}
      {shareGoal && username && (
        <GoalShareCard
          open={!!shareGoal}
          onOpenChange={(open) => !open && setShareGoal(null)}
          goal={shareGoal}
          username={username}
          displayName={displayName}
        />
      )}
    </>
  );
}
