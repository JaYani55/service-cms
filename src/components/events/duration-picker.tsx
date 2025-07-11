import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DurationPickerProps {
  value?: number; // duration in minutes
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: number; // minimum duration in minutes
  max?: number; // maximum duration in minutes
}

export function DurationPicker({ 
  value = 60, 
  onChange, 
  placeholder = 'Select duration',
  disabled = false,
  className,
  min = 15,
  max = 480 // 8 hours max
}: DurationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);

  useEffect(() => {
    const newHours = Math.floor(value / 60);
    const newMinutes = value % 60;
    setHours(newHours);
    setMinutes(newMinutes);
  }, [value]);

  const formatDuration = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  const updateDuration = (newHours: number, newMinutes: number) => {
    const totalMinutes = Math.max(min, Math.min(max, newHours * 60 + newMinutes));
    const finalHours = Math.floor(totalMinutes / 60);
    const finalMinutes = totalMinutes % 60;
    
    setHours(finalHours);
    setMinutes(finalMinutes);
    onChange(totalMinutes);
  };

  const adjustValue = (type: 'hours' | 'minutes', delta: number) => {
    if (type === 'hours') {
      updateDuration(Math.max(0, hours + delta), minutes);
    } else {
      const newMinutes = minutes + delta;
      if (newMinutes >= 60) {
        updateDuration(hours + Math.floor(newMinutes / 60), newMinutes % 60);
      } else if (newMinutes < 0) {
        updateDuration(Math.max(0, hours - 1), 60 + newMinutes);
      } else {
        updateDuration(hours, newMinutes);
      }
    }
  };

  // Common durations for quick selection
  const commonDurations = [
    { label: '30min', minutes: 30 },
    { label: '45min', minutes: 45 },
    { label: '1h', minutes: 60 },
    { label: '1.5h', minutes: 90 },
    { label: '2h', minutes: 120 },
    { label: '3h', minutes: 180 },
    { label: '4h', minutes: 240 },
    { label: '6h', minutes: 360 },
  ].filter(d => d.minutes >= min && d.minutes <= max);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={formatDuration(value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-10", className)}
            readOnly
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Clock className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-4">
          <div className="text-sm font-medium mb-3 text-center">Select Duration</div>
          
          {/* Manual adjustment controls */}
          <div className="flex items-center justify-center gap-6 mb-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => adjustValue('hours', 1)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-mono font-bold min-w-[2ch] text-center">
                {hours}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => adjustValue('hours', -1)}
                disabled={hours === 0 && minutes <= min}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground mt-1">hours</div>
            </div>
            
            <div className="text-2xl font-mono font-bold">:</div>
            
            <div className="flex flex-col items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => adjustValue('minutes', 15)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-mono font-bold min-w-[3ch] text-center">
                {minutes.toString().padStart(2, '0')}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => adjustValue('minutes', -15)}
                disabled={hours === 0 && minutes <= min}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground mt-1">minutes</div>
            </div>
          </div>

          {/* Quick selection buttons */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Quick select:</div>
            <div className="grid grid-cols-4 gap-2">
              {commonDurations.map((duration) => (
                <Button
                  key={duration.minutes}
                  type="button"
                  variant={value === duration.minutes ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    onChange(duration.minutes);
                    setIsOpen(false);
                  }}
                >
                  {duration.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Current selection display */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Selected duration:</div>
            <div className="text-lg font-semibold">{formatDuration(value)}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}