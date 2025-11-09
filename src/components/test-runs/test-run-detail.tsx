"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, UserIcon, CheckCircle2Icon, XCircleIcon, AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TestRunStatusBadge } from "./test-run-status-badge";
import { PressureTestGraph } from "@/components/tests/pressure-test-graph";
import type { TestRunMeasurements, TestRunResults } from "@/lib/db/schema/test-runs";
import type { PressureTestConfig } from "@/lib/db/schema/pressure-tests";

interface TestRunDetailProps {
  run: {
    id: string;
    runNumber: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    durationSeconds: number | null;
    measurements: TestRunMeasurements | null;
    results: TestRunResults | null;
    notes: string | null;
    operatorObservations: string | null;
    operatorName: string | null;
    testNumber: string;
    testName: string;
    testConfig: PressureTestConfig;
  };
}

export function TestRunDetail({ run }: TestRunDetailProps) {
  // Convert measurements to format for graph
  const measurements = useMemo(() => {
    if (!run.measurements?.dataPoints) return [];

    return run.measurements.dataPoints.map(point => ({
      timestamp: new Date(point.timestamp),
      pressure: point.pressure,
      temperature: point.temperature,
    }));
  }, [run.measurements]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getResultIcon = (status: string | undefined) => {
    switch (status) {
      case "passed":
        return <CheckCircle2Icon className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Run #{run.runNumber}</h2>
          <p className="text-sm text-muted-foreground">
            {run.testNumber} - {run.testName}
          </p>
        </div>
        <TestRunStatusBadge status={run.status} />
      </div>

      {/* Run Information */}
      <Card>
        <CardHeader>
          <CardTitle>Run Information</CardTitle>
          <CardDescription>Details about this test execution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Operator</p>
                <p className="text-sm text-muted-foreground">{run.operatorName || "Unknown"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(run.durationSeconds)}
                </p>
              </div>
            </div>

            {run.startedAt && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(run.startedAt), "PPp")}
                  </p>
                </div>
              </div>
            )}

            {run.completedAt && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(run.completedAt), "PPp")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {run.results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Pass/fail status and deviation analysis</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getResultIcon(run.results.status)}
                <Badge
                  variant={
                    run.results.status === "passed"
                      ? "outline"
                      : run.results.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                  className={
                    run.results.status === "passed"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                      : run.results.status === "warning"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                      : ""
                  }
                >
                  {run.results.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Min Pressure</p>
                  <p className="text-lg font-semibold">
                    {run.results.statistics.minPressure.toFixed(2)} MPa
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Pressure</p>
                  <p className="text-lg font-semibold">
                    {run.results.statistics.maxPressure.toFixed(2)} MPa
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Pressure</p>
                  <p className="text-lg font-semibold">
                    {run.results.statistics.avgPressure.toFixed(2)} MPa
                  </p>
                </div>
                {run.results.statistics.stdDeviation && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Std Deviation</p>
                    <p className="text-lg font-semibold">
                      {run.results.statistics.stdDeviation.toFixed(3)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Deviations */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Deviations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Deviation</p>
                  <p className="text-lg font-semibold">
                    {run.results.deviations.maxDeviation.toFixed(3)} MPa
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Deviation</p>
                  <p className="text-lg font-semibold">
                    {run.results.deviations.avgDeviation.toFixed(3)} MPa
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Exceedances</p>
                  <p className="text-lg font-semibold">{run.results.deviations.exceedances}</p>
                </div>
              </div>
            </div>

            {/* Specification Comparison */}
            {run.results.specification && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">Specification Comparison</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Expected Pressure</p>
                      <p className="text-lg font-semibold">
                        {run.results.specification.expectedPressure.toFixed(2)} MPa
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Allowable Drop</p>
                      <p className="text-lg font-semibold">
                        {run.results.specification.allowableDrop.toFixed(2)} MPa
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Planned Duration</p>
                      <p className="text-lg font-semibold">
                        {formatDuration(run.results.specification.plannedDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Measurements Graph */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>
              {run.measurements?.totalPoints || 0} data points (sampling rate:{" "}
              {run.measurements?.samplingRate || 0}s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PressureTestGraph
              measurements={measurements}
              targetPressure={run.testConfig.workingPressure}
              maxPressure={run.testConfig.maxPressure}
              pressureUnit={run.testConfig.pressureUnit || "MPa"}
              enableDownsampling={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(run.notes || run.operatorObservations) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes and Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {run.notes && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{run.notes}</p>
              </div>
            )}
            {run.operatorObservations && (
              <>
                {run.notes && <Separator />}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Operator Observations</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {run.operatorObservations}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
