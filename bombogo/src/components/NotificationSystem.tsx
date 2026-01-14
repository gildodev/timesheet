/**
 * Notification System
 * Manages notifications and reminders with sound
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { goalStorage, timeEntryStorage, reminderStorage } from '@/lib/storage';

// Notification sound using Web Audio API
const playNotificationSound = () => {
  try {
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
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

export function NotificationSystem() {

  useEffect(() => {
    // Check goals every hour
    const checkGoals = async () => {
      try {
        const dailyGoal = await goalStorage.getActiveDailyGoal();
        if (dailyGoal) {
          const todayEntries = await timeEntryStorage.getTodayEntries();
          const todaySeconds = timeEntryStorage.calculateTotalDuration(todayEntries);
          const todayHours = todaySeconds / 3600;
          const progress = (todayHours / dailyGoal.targetHours) * 100;

          if (progress >= 100) {
            playNotificationSound();
            toast.success('🎉 Meta diária atingida!', {
              description: `Você trabalhou ${todayHours.toFixed(1)}h hoje!`,
            });
          } else if (progress >= 75) {
            playNotificationSound();
            toast.info('Quase lá! 💪', {
              description: `Faltam apenas ${(dailyGoal.targetHours - todayHours).toFixed(1)}h para sua meta diária.`,
            });
          }
        }
      } catch (error) {
        console.error('Error checking goals:', error);
      }
    };

    // Check every hour
    const interval = setInterval(checkGoals, 60 * 60 * 1000);

    // Check on load
    checkGoals();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check reminders every minute
    const checkReminders = async () => {
      try {
        const remindersToNotify = await reminderStorage.getRemindersToNotify();
        
        for (const reminder of remindersToNotify) {
          playNotificationSound();
          toast.warning(`🔔 Lembrete: ${reminder.title}`, {
            description: reminder.description || `Prazo: ${reminder.dueDate}${reminder.dueTime ? ` às ${reminder.dueTime}` : ''}`,
            duration: 10000,
          });
          await reminderStorage.markAsNotified(reminder.id);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60 * 1000);

    // Check on load
    checkReminders();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Remind to take breaks (every 2 hours)
    const remindBreak = async () => {
      try {
        const runningEntry = await timeEntryStorage.getRunningEntry();
        if (runningEntry) {
          const elapsed = Date.now() - new Date(runningEntry.startTime).getTime();
          const hours = elapsed / (1000 * 60 * 60);
          
          if (hours >= 2) {
            playNotificationSound();
            toast.warning('Hora de uma pausa! ☕', {
              description: 'Você está trabalhando há mais de 2 horas.',
            });
          }
        }
      } catch (error) {
        console.error('Error checking break reminder:', error);
      }
    };

    const interval = setInterval(remindBreak, 30 * 60 * 1000); // Check every 30 min

    return () => clearInterval(interval);
  }, []);

  return null;
}
