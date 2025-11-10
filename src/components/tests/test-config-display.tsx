import { PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestConfigDisplayProps {
  config: PressureTestConfig;
}

export function TestConfigDisplay({ config }: TestConfigDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Core Parameters */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Core Parameters</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-1">
              <div className="text-sm text-muted-foreground">Working Pressure</div>
              <div className="text-lg font-semibold">
                {config.workingPressure} {config.pressureUnit}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-1">
              <div className="text-sm text-muted-foreground">Max Pressure</div>
              <div className="text-lg font-semibold">
                {config.maxPressure} {config.pressureUnit}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-1">
              <div className="text-sm text-muted-foreground">Test Duration</div>
              <div className="text-lg font-semibold">
                {config.testDuration} hours
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-1">
              <div className="text-sm text-muted-foreground">Temperature</div>
              <div className="text-lg font-semibold">
                {config.temperature}°{config.temperatureUnit}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-1">
              <div className="text-sm text-muted-foreground">Allowable Pressure Drop</div>
              <div className="text-lg font-semibold">
                {config.allowablePressureDrop} {config.pressureUnit}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intermediate Stages */}
      {config.intermediateStages && config.intermediateStages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Intermediate Stages
            <Badge variant="secondary" className="ml-2">
              {config.intermediateStages.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {config.intermediateStages.map((stage, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{stage.pressure} {config.pressureUnit}</span>
                        <span className="text-muted-foreground"> at {stage.time} min</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Hold for {stage.duration} minutes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(config.notes || config.equipmentId || config.operatorName) && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
          <div className="space-y-3">
            {config.equipmentId && (
              <div className="flex items-start gap-2">
                <div className="text-sm text-muted-foreground min-w-[120px]">Equipment ID:</div>
                <div className="text-sm font-medium">{config.equipmentId}</div>
              </div>
            )}
            {config.operatorName && (
              <div className="flex items-start gap-2">
                <div className="text-sm text-muted-foreground min-w-[120px]">Operator:</div>
                <div className="text-sm font-medium">{config.operatorName}</div>
              </div>
            )}
            {config.notes && (
              <div className="flex items-start gap-2">
                <div className="text-sm text-muted-foreground min-w-[120px]">Notes:</div>
                <div className="text-sm whitespace-pre-wrap">{config.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
