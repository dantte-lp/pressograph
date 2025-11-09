"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createTestRun } from "@/lib/actions/test-runs";

interface StartTestRunButtonProps {
  testId: string;
  testNumber: string;
  testName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function StartTestRunButton({
  testId,
  testNumber,
  testName,
  variant = "default",
  size = "default",
  className,
}: StartTestRunButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRun = async () => {
    setIsLoading(true);

    try {
      const run = await createTestRun({
        testId,
        status: "scheduled",
        startedAt: new Date(),
        notes: notes.trim() || undefined,
      });

      toast.success("Test run created", {
        description: `Run #${run.runNumber} has been scheduled`,
      });

      setOpen(false);
      setNotes("");

      // Navigate to the new run
      router.push(`/tests/${testId}/runs/${run.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create test run:", error);
      toast.error("Failed to create test run", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <PlayIcon className="mr-2 h-4 w-4" />
          Start New Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Test Run</DialogTitle>
          <DialogDescription>
            Create a new execution run for {testNumber} - {testName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Test Information</Label>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{testNumber}</p>
              <p className="text-muted-foreground">{testName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Initial Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Enter any pre-test notes, equipment checks, or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You can add more detailed notes and observations during and after the test run.
            </p>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Record measurements during test execution</li>
              <li>Add operator observations</li>
              <li>View analysis and results</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleStartRun} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" />
                Start Run
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
