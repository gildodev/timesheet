/**
 * Pomodoro Timer component
 * Configurable Pomodoro technique timer
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { pomodoroStorage } from '@/lib/storage';
import { PomodoroSettings, PomodoroSession } from '@/types';
import { formatDuration, cn } from '@/lib/utils';
import { toast } from 'sonner';
import gsap from 'gsap';

interface PomodoroTimerProps {
  taskId?: string;
}

type TimerType = 'work' | 'break' | 'long-break';

export function PomodoroTimer({ taskId }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(pomodoroStorage.getSettings());
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [timerType, setTimerType] = useState<TimerType>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const timerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const maxTime = useMemo(() => {
    switch (timerType) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'long-break':
        return settings.longBreakDuration * 60;
    }
  }, [timerType, settings]);

  const progress = ((maxTime - timeLeft) / maxTime) * 100;

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Animate on start
  useEffect(() => {
    if (isRunning && timerRef.current) {
      gsap.to(timerRef.current, {
        scale: 1.05,
        duration: 0.5,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      });
    } else if (timerRef.current) {
      gsap.killTweensOf(timerRef.current);
      gsap.to(timerRef.current, { scale: 1, duration: 0.3 });
    }
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    // Complete current session
    if (currentSession) {
      pomodoroStorage.completeSession(currentSession.id, maxTime);
      setCurrentSession(null);
    }

    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    // Show notification
    if (timerType === 'work') {
      toast.success('Pomodoro concluído! Hora de uma pausa. 🎉');
      setSessionsCompleted((prev) => prev + 1);

      // Check if it's time for long break
      const nextSessionCount = sessionsCompleted + 1;
      if (nextSessionCount % settings.sessionsUntilLongBreak === 0) {
        setTimerType('long-break');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimerType('break');
        setTimeLeft(settings.breakDuration * 60);
      }

      if (settings.autoStartBreaks) {
        setTimeout(() => handleStart(), 1000);
      }
    } else {
      toast.success('Pausa finalizada! Pronto para trabalhar? 💪');
      setTimerType('work');
      setTimeLeft(settings.workDuration * 60);

      if (settings.autoStartWork) {
        setTimeout(() => handleStart(), 1000);
      }
    }
  };

  const handleStart = () => {
    if (timeLeft === 0) return;

    const session = pomodoroStorage.createSession(timerType, taskId);
    setCurrentSession(session);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(maxTime);

    if (currentSession) {
      pomodoroStorage.interruptSession(currentSession.id, maxTime - timeLeft);
      setCurrentSession(null);
    }
  };

  const handleSettingsUpdate = (updates: Partial<PomodoroSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    pomodoroStorage.updateSettings(newSettings);

    // Update current timer if not running
    if (!isRunning) {
      setTimeLeft(newSettings.workDuration * 60);
    }
  };

  const playNotificationSound = () => {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const timerTypeConfig = {
    work: { label: 'Foco', color: 'text-success', bgColor: 'bg-success/10' },
    break: { label: 'Pausa Curta', color: 'text-primary', bgColor: 'bg-primary/10' },
    'long-break': { label: 'Pausa Longa', color: 'text-warning', bgColor: 'bg-warning/10' },
  };

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Modo Pomodoro</h3>
          <p className="text-sm text-muted-foreground">
            {sessionsCompleted} sessões concluídas hoje
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurações do Pomodoro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Duração do Foco (minutos)</Label>
                <Input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) =>
                    handleSettingsUpdate({ workDuration: Number(e.target.value) })
                  }
                  min={1}
                  max={60}
                />
              </div>

              <div className="space-y-2">
                <Label>Duração da Pausa Curta (minutos)</Label>
                <Input
                  type="number"
                  value={settings.breakDuration}
                  onChange={(e) =>
                    handleSettingsUpdate({ breakDuration: Number(e.target.value) })
                  }
                  min={1}
                  max={30}
                />
              </div>

              <div className="space-y-2">
                <Label>Duração da Pausa Longa (minutos)</Label>
                <Input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) =>
                    handleSettingsUpdate({ longBreakDuration: Number(e.target.value) })
                  }
                  min={1}
                  max={60}
                />
              </div>

              <div className="space-y-2">
                <Label>Sessões até Pausa Longa</Label>
                <Input
                  type="number"
                  value={settings.sessionsUntilLongBreak}
                  onChange={(e) =>
                    handleSettingsUpdate({
                      sessionsUntilLongBreak: Number(e.target.value),
                    })
                  }
                  min={2}
                  max={10}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Iniciar pausas automaticamente</Label>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) =>
                    handleSettingsUpdate({ autoStartBreaks: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Iniciar foco automaticamente</Label>
                <Switch
                  checked={settings.autoStartWork}
                  onCheckedChange={(checked) =>
                    handleSettingsUpdate({ autoStartWork: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Som de notificação</Label>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingsUpdate({ soundEnabled: checked })
                  }
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {/* Timer type badge */}
        <div className="flex justify-center">
          <div
            className={cn(
              'px-4 py-2 rounded-full font-medium',
              timerTypeConfig[timerType].bgColor,
              timerTypeConfig[timerType].color
            )}
          >
            {timerTypeConfig[timerType].label}
          </div>
        </div>

        {/* Timer display */}
        <div ref={timerRef} className="text-center">
          <div className="text-7xl font-mono font-bold gradient-text mb-4">
            {formatDuration(timeLeft)}
          </div>
          <Progress value={progress} className="h-2" ref={progressRef} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={timeLeft === 0}
              className="gap-2"
            >
              <Play className="w-5 h-5" />
              Iniciar
            </Button>
          ) : (
            <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2">
              <Pause className="w-5 h-5" />
              Pausar
            </Button>
          )}

          <Button size="lg" onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="w-5 h-5" />
            Resetar
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                i < sessionsCompleted % settings.sessionsUntilLongBreak
                  ? 'bg-success'
                  : 'bg-secondary'
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
