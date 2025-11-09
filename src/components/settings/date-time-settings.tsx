'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COMMON_TIMEZONES,
  type DateFormat,
  type TimeFormat,
} from '@/lib/utils/date-time';
import {
  updateTimezone,
  updateDateFormat,
  updateTimeFormat,
  getUserPreferences,
} from '@/lib/actions/user-preferences';
import { toast } from 'sonner';

interface DateTimeSettingsProps {
  initialTimezone?: string;
  initialDateFormat?: DateFormat;
  initialTimeFormat?: TimeFormat;
}

export function DateTimeSettings({
  initialTimezone = 'UTC',
  initialDateFormat = 'YYYY-MM-DD',
  initialTimeFormat = '24h',
}: DateTimeSettingsProps) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dateFormat, setDateFormat] = useState<DateFormat>(initialDateFormat);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(initialTimeFormat);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const result = await getUserPreferences();
      if (result.success && result.data) {
        setTimezone(result.data.timezone);
        setDateFormat(result.data.dateFormat as DateFormat);
        setTimeFormat(result.data.timeFormat as TimeFormat);
      }
    };
    loadPreferences();
  }, []);

  const handleTimezoneChange = async (value: string) => {
    setIsLoading(true);
    setTimezone(value);
    const result = await updateTimezone(value);
    setIsLoading(false);

    if (result.success) {
      toast.success('Timezone updated');
    } else {
      toast.error(result.error || 'Failed to update timezone');
      // Revert on error
      setTimezone(timezone);
    }
  };

  const handleDateFormatChange = async (value: DateFormat) => {
    setIsLoading(true);
    setDateFormat(value);
    const result = await updateDateFormat(value);
    setIsLoading(false);

    if (result.success) {
      toast.success('Date format updated');
    } else {
      toast.error(result.error || 'Failed to update date format');
      setDateFormat(dateFormat);
    }
  };

  const handleTimeFormatChange = async (value: TimeFormat) => {
    setIsLoading(true);
    setTimeFormat(value);
    const result = await updateTimeFormat(value);
    setIsLoading(false);

    if (result.success) {
      toast.success('Time format updated');
    } else {
      toast.error(result.error || 'Failed to update time format');
      setTimeFormat(timeFormat);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={handleTimezoneChange} disabled={isLoading}>
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All dates and times will be displayed in this timezone
        </p>
      </div>

      {/* Date Format */}
      <div className="space-y-2">
        <Label htmlFor="date-format">Date Format</Label>
        <Select value={dateFormat} onValueChange={handleDateFormatChange} disabled={isLoading}>
          <SelectTrigger id="date-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
            <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (EU/RU)</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Example: {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </p>
      </div>

      {/* Time Format */}
      <div className="space-y-2">
        <Label htmlFor="time-format">Time Format</Label>
        <Select value={timeFormat} onValueChange={handleTimeFormatChange} disabled={isLoading}>
          <SelectTrigger id="time-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
            <SelectItem value="24h">24-hour</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Example: {timeFormat === '12h' ? '02:30 PM' : '14:30'}
        </p>
      </div>
    </div>
  );
}
