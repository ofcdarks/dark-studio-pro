import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw, Coffee, Zap, X, Minimize2, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type SessionType = 'work' | 'break' | 'longBreak';

const DEFAULT_TIMES = {
  work: 25,
  break: 5,
  longBreak: 15,
};

export function FloatingPomodoro() {
  const [times] = useState(DEFAULT_TIMES);
  const [timeLeft, setTimeLeft] = useState(times.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    const totalTime = sessionType === 'work' 
      ? times.work * 60 
      : sessionType === 'break' 
        ? times.break * 60 
        : times.longBreak * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Play notification sound
  const playNotification = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    playNotification();
    
    if (sessionType === 'work') {
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F97316', '#22C55E'],
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold">Sessão completa! 🎯</p>
            <p className="text-sm text-muted-foreground">
              {newCount} {newCount === 1 ? 'sessão' : 'sessões'} hoje. Hora do descanso!
            </p>
          </div>
        </div>,
        { duration: 4000 }
      );
      
      if (newCount % 4 === 0) {
        setSessionType('longBreak');
        setTimeLeft(times.longBreak * 60);
      } else {
        setSessionType('break');
        setTimeLeft(times.break * 60);
      }
    } else {
      toast.info(
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          <span>Descanso finalizado! Bora produzir 💪</span>
        </div>
      );
      setSessionType('work');
      setTimeLeft(times.work * 60);
    }
    
    setIsRunning(false);
  }, [sessionType, completedSessions, times, playNotification]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, handleSessionComplete]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(
      sessionType === 'work' 
        ? times.work * 60 
        : sessionType === 'break' 
          ? times.break * 60 
          : times.longBreak * 60
    );
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work': return 'text-primary';
      case 'break': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
    }
  };

  const getProgressColor = () => {
    switch (sessionType) {
      case 'work': return 'bg-primary';
      case 'break': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
    }
  };

  const getBorderColor = () => {
    switch (sessionType) {
      case 'work': return 'border-primary/50';
      case 'break': return 'border-green-500/50';
      case 'longBreak': return 'border-blue-500/50';
    }
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        onClick={() => setIsVisible(true)}
      >
        <Timer className="h-5 w-5" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300",
          "bg-card/95",
          getBorderColor(),
          isExpanded ? "w-64" : "w-auto"
        )}
      >
        {/* Compact View */}
        {!isExpanded && (
          <div 
            className="flex items-center gap-2 p-2 cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              sessionType === 'work' ? 'bg-primary/20' : sessionType === 'break' ? 'bg-green-500/20' : 'bg-blue-500/20'
            )}>
              <Timer className={cn("h-5 w-5", getSessionColor())} />
            </div>
            <div className="pr-2">
              <p className={cn("text-lg font-bold font-mono", getSessionColor())}>
                {formatTime(timeLeft)}
              </p>
              <div className="h-1 w-16 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all", getProgressColor())}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
            {isRunning && (
              <span className="relative flex h-2 w-2">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  sessionType === 'work' ? 'bg-primary' : sessionType === 'break' ? 'bg-green-500' : 'bg-blue-500'
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  getProgressColor()
                )}></span>
              </span>
            )}
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={cn("h-4 w-4", getSessionColor())} />
                <span className="text-sm font-medium">Pomodoro</span>
                <span className="text-xs text-muted-foreground">
                  {completedSessions} 🍅
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setIsVisible(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Session Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              {(['work', 'break', 'longBreak'] as SessionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setIsRunning(false);
                    setSessionType(type);
                    setTimeLeft(times[type] * 60);
                  }}
                  className={cn(
                    "flex-1 py-1 px-2 text-xs font-medium rounded transition-colors",
                    sessionType === type
                      ? type === 'work' 
                        ? 'bg-primary text-primary-foreground' 
                        : type === 'break'
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  {type === 'work' ? 'Foco' : type === 'break' ? 'Pausa' : 'Longa'}
                </button>
              ))}
            </div>

            {/* Timer */}
            <div className="text-center py-2">
              <p className={cn("text-3xl font-bold font-mono", getSessionColor())}>
                {formatTime(timeLeft)}
              </p>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000", getProgressColor())}
                style={{ width: `${getProgress()}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} size="sm" className="gap-1.5 h-8">
                  <Play className="h-3 w-3" />
                  Iniciar
                </Button>
              ) : (
                <Button onClick={handlePause} size="sm" variant="secondary" className="gap-1.5 h-8">
                  <Pause className="h-3 w-3" />
                  Pausar
                </Button>
              )}
              <Button onClick={handleReset} size="sm" variant="outline" className="gap-1.5 h-8">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
