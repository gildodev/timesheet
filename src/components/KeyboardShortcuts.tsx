/**
 * Keyboard Shortcuts Handler
 * Global keyboard shortcuts for productivity
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KeyboardShortcutsProps {
  onOpenSearch: () => void;
  onOpenTagManager: () => void;
  onStartTimer: () => void;
}

export function KeyboardShortcuts({
  onOpenSearch,
  onOpenTagManager,
  onStartTimer,
}: KeyboardShortcutsProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      }

      // Ctrl/Cmd + T - Open tag manager
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        onOpenTagManager();
      }

      // Ctrl/Cmd + S - Start/Stop timer
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onStartTimer();
      }

      // Ctrl/Cmd + 1-7 - Navigate
      if ((e.ctrlKey || e.metaKey) && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        const routes = [
          '/dashboard',
          '/projects',
          '/tasks',
          '/timesheet',
          '/reports',
          '/pomodoro',
          '/settings',
        ];
        navigate(routes[parseInt(e.key) - 1]);
      }

      // ? - Show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement.tagName !== 'INPUT' &&
          activeElement.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          showShortcutsToast();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onOpenSearch, onOpenTagManager, onStartTimer]);

  return null;
}

function showShortcutsToast() {
  const shortcuts = [
    { key: 'Ctrl/Cmd + K', action: 'Busca global' },
    { key: 'Ctrl/Cmd + T', action: 'Gerenciar tags' },
    { key: 'Ctrl/Cmd + S', action: 'Iniciar/Parar timer' },
    { key: 'Ctrl/Cmd + 1-7', action: 'Navegar páginas' },
    { key: '?', action: 'Mostrar atalhos' },
  ];

  const message = shortcuts
    .map(s => `${s.key}: ${s.action}`)
    .join('\n');

  toast.info('Atalhos de Teclado', {
    description: (
      <div className="space-y-1 mt-2">
        {shortcuts.map(s => (
          <div key={s.key} className="flex justify-between gap-4 text-xs">
            <kbd className="px-2 py-1 bg-secondary rounded font-mono">{s.key}</kbd>
            <span>{s.action}</span>
          </div>
        ))}
      </div>
    ),
    duration: 5000,
  });
}
