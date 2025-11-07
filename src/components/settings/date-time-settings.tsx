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
  getUserDateTimeConfig,
  setUserDateTimeConfig,
  COMMON_TIMEZONES,
  type DateFormat,
  type TimeFormat,
} from '@/lib/utils/date-time';
import { toast } from 'sonner';

export function DateTimeSettings() {
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState<DateFormat>('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');

  // Load settings on mount
  useEffect(() => {
    const config = getUserDateTimeConfig();
    setTimezone(config.timezone);
    setDateFormat(config.dateFormat);
    setTimeFormat(config.timeFormat);
  }, []);

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setUserDateTimeConfig({ timezone: value });
    toast.success('Settings saved');
  };

  const handleDateFormatChange = (value: DateFormat) => {
    setDateFormat(value);
    setUserDateTimeConfig({ dateFormat: value });
    toast.success('Settings saved');
  };

  const handleTimeFormatChange = (value: TimeFormat) => {
    setTimeFormat(value);
    setUserDateTimeConfig({ timeFormat: value });
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6">
      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={handleTimezoneChange}>
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
        <Select value={dateFormat} onValueChange={handleDateFormatChange}>
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
        <Select value={timeFormat} onValueChange={handleTimeFormatChange}>
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
