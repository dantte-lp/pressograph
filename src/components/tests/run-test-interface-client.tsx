'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlayIcon, PauseIcon, StopCircleIcon, DownloadIcon, SaveIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PressureTestGraph } from './pressure-test-graph';
import { startTestRun, recordMeasurement, completeTestRun } from '@/lib/actions/test-runs';

interface Measurement {
  timestamp: Date;
  pressure: number;
  temperature?: number;
}

interface RunTestInterfaceClientProps {
  test: any;
}

export function RunTestInterfaceClient({ test }: RunTestInterfaceClientProps) {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'paused' | 'completing' | 'completed'>('idle');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPressure, setCurrentPressure] = useState<number>(0);
  const [currentTemperature, setCurrentTemperature] = useState<number | undefined>(test.config.temperature);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start test run
  const handleStartTest = async () => {
    setStatus('starting');
    try {
      const result = await startTestRun(test.id);

      if (result.success && result.runId) {
        setRunId(result.runId);
        setStartTime(new Date());
        setStatus('running');
        toast.success('Test run started successfully');

        // Start elapsed time counter
        startTimer();
      } else {
        toast.error(result.error || 'Failed to start test run');
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('An unexpected error occurred');
      setStatus('idle');
    }
  };

  // Start elapsed time timer
  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  // Stop timer
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Record a measurement
  const handleRecordMeasurement = async () => {
    if (!runId || status !== 'running') {
      toast.error('Test must be running to record measurements');
      return;
    }

    if (currentPressure <= 0) {
      toast.error('Please enter a valid pressure value');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordMeasurement(runId, {
        pressure: currentPressure,
        temperature: currentTemperature,
        timestamp: new Date(),
      });

      if (result.success) {
        const newMeasurement: Measurement = {
          timestamp: new Date(),
          pressure: currentPressure,
          temperature: currentTemperature,
        };

        setMeasurements(prev => [...prev, newMeasurement]);
        toast.success('Measurement recorded');

        // Clear the input (optional - keep last value for convenience)
        // setCurrentPressure(0);
      } else {
        toast.error(result.error || 'Failed to record measurement');
      }
    } catch (error) {
      console.error('Error recording measurement:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key press in pressure input
  const handlePressureKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRecordMeasurement();
    }
  };

  // Pause test (future feature)
  const handlePauseTest = () => {
    if (status === 'running') {
      setStatus('paused');
      stopTimer();
      toast.info('Test paused');
    } else if (status === 'paused') {
      setStatus('running');
      startTimer();
      toast.info('Test resumed');
    }
  };

  // Show complete dialog
  const handleStopTest = () => {
    setShowCompleteDialog(true);
  };

  // Complete test run
  const handleCompleteTest = async () => {
    if (!runId) return;

    setStatus('completing');
    setShowCompleteDialog(false);
    stopTimer();

    try {
      const result = await completeTestRun(runId);

      if (result.success) {
        setStatus('completed');
        toast.success(`Test completed - ${result.passed ? 'PASSED' : 'FAILED'}`);

        // Redirect to test run results page after a short delay
        setTimeout(() => {
          router.push(`/tests/${test.id}/runs/${runId}`);
          router.refresh();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to complete test');
        setStatus('running');
        startTimer();
      }
    } catch (error) {
      console.error('Error completing test:', error);
      toast.error('An unexpected error occurred');
      setStatus('running');
      startTimer();
    }
  };

  // Download current data as CSV
  const handleDownloadData = () => {
    if (measurements.length === 0) {
      toast.error('No measurements to download');
      return;
    }

    const headers = ['Timestamp', 'Pressure', 'Temperature'];
    const rows = measurements.map(m => [
      m.timestamp.toISOString(),
      m.pressure,
      m.temperature || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-run-${test.testNumber}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported as CSV');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Auto-complete test when duration elapsed (optional feature)
  useEffect(() => {
    const testDurationSeconds = test.config.testDuration * 60;
    if (status === 'running' && elapsedSeconds >= testDurationSeconds) {
      toast.info('Test duration elapsed - ready to complete test');
      // Auto-stop option could be added here
    }
  }, [status, elapsedSeconds, test.config.testDuration]);

  return (
    <div className="space-y-6">
      {/* Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Status</span>
            <Badge
              variant={
                status === 'running'
                  ? 'default'
                  : status === 'completed'
                  ? 'default'
                  : 'secondary'
              }
              className={status === 'running' ? 'animate-pulse' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Elapsed Time</div>
              <div className="text-2xl font-bold">{formatElapsedTime(elapsedSeconds)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Pressure</div>
              <div className="text-2xl font-bold">
                {measurements.length > 0
                  ? `${measurements[measurements.length - 1].pressure} ${test.config.pressureUnit || 'MPa'}`
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Target Pressure</div>
              <div className="text-2xl font-bold">
                {test.config.workingPressure} {test.config.pressureUnit || 'MPa'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Measurements</div>
              <div className="text-2xl font-bold">{measurements.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Control Panel */}
      {status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Start Test</CardTitle>
            <CardDescription>
              Click the button below to begin the pressure test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStartTest} size="lg" className="w-full md:w-auto">
              <PlayIcon className="mr-2 h-5 w-5" />
              Start Test Run
            </Button>
          </CardContent>
        </Card>
      )}

      {(status === 'running' || status === 'paused') && (
        <>
          {/* Real-time Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Pressure Graph</CardTitle>
              <CardDescription>
                Live visualization of recorded measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PressureTestGraph
                measurements={measurements}
                targetPressure={test.config.workingPressure}
                maxPressure={test.config.maxPressure}
                pressureUnit={test.config.pressureUnit || 'MPa'}
              />
            </CardContent>
          </Card>

          {/* Measurement Input */}
          <Card>
            <CardHeader>
              <CardTitle>Record Measurement</CardTitle>
              <CardDescription>
                Enter current pressure and temperature readings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pressure">
                    Pressure ({test.config.pressureUnit || 'MPa'}) *
                  </Label>
                  <Input
                    id="pressure"
                    type="number"
                    step="0.1"
                    value={currentPressure}
                    onChange={(e) => setCurrentPressure(parseFloat(e.target.value) || 0)}
                    onKeyPress={handlePressureKeyPress}
                    placeholder="0.0"
                    disabled={status !== 'running'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={currentTemperature || ''}
                    onChange={(e) =>
                      setCurrentTemperature(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Optional"
                    disabled={status !== 'running'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timestamp</Label>
                  <Input
                    type="text"
                    value={new Date().toLocaleString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button
                onClick={handleRecordMeasurement}
                disabled={status !== 'running' || isSubmitting}
                className="w-full md:w-auto"
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Recording...' : 'Record Measurement'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Measurements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Measurements</CardTitle>
              <CardDescription>
                Last 10 recorded measurements (newest first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {measurements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No measurements recorded yet
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Pressure ({test.config.pressureUnit || 'MPa'})</TableHead>
                        <TableHead>Temperature (°C)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {measurements
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map((measurement, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {measurement.timestamp.toLocaleTimeString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {measurement.pressure.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {measurement.temperature?.toFixed(1) || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handlePauseTest}
                  disabled={status === 'completing'}
                >
                  <PauseIcon className="mr-2 h-4 w-4" />
                  {status === 'paused' ? 'Resume Test' : 'Pause Test'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownloadData}
                  disabled={measurements.length === 0}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download Current Data
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleStopTest}
                  disabled={status !== 'running'}
                  className="ml-auto"
                >
                  <StopCircleIcon className="mr-2 h-4 w-4" />
                  Complete Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {status === 'completing' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium">Completing test and calculating results...</div>
              <div className="text-sm text-muted-foreground">
                Please wait while we process the test data
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'completed' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium text-green-600">Test completed successfully!</div>
              <div className="text-sm text-muted-foreground">
                Redirecting to test results...
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Test Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Test Run?</DialogTitle>
            <DialogDescription>
              This will stop the test and calculate final results. Are you sure you want to
              complete this test?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elapsed Time:</span>
              <span className="font-medium">{formatElapsedTime(elapsedSeconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Measurements Recorded:</span>
              <span className="font-medium">{measurements.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Pressure:</span>
              <span className="font-medium">
                {measurements.length > 0
                  ? `${measurements[measurements.length - 1].pressure} ${test.config.pressureUnit || 'MPa'}`
                  : 'No data'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCompleteTest}>
              Complete Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
