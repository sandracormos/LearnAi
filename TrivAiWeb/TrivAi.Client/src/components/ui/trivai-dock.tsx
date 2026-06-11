import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';

export type TrivAiDockItem = {
  id: string;
  name: string;
  icon: ReactNode;
};

type TrivAiDockProps = {
  apps: TrivAiDockItem[];
  activeApp?: string;
  onAppClick: (appId: string) => void;
};

export function TrivAiDock({ apps, activeApp, onAppClick }: TrivAiDockProps) {
  const [mouseY, setMouseY] = useState<number | null>(null);
  const baseSize = 44;
  const gap = 8;
  const effectHeight = 180;

  const getScale = useCallback((index: number) => {
    if (mouseY === null) {
      return 1;
    }

    const center = index * (baseSize + gap) + baseSize / 2;
    const distance = Math.abs(mouseY - center);

    if (distance > effectHeight / 2) {
      return 1;
    }

    const progress = 1 - distance / (effectHeight / 2);
    return 1 + (1 - Math.cos(progress * Math.PI)) * 0.32;
  }, [mouseY]);

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMouseY(event.clientY - rect.top - 10);
  }

  return (
    <nav
      className="trivai-dock"
      aria-label="App navigation"
      onMouseLeave={() => setMouseY(null)}
      onMouseMove={handleMouseMove}
    >
      {apps.map((app, index) => {
        const scale = getScale(index);

        return (
          <button
            className={activeApp === app.id ? 'active' : ''}
            key={app.id}
            title={app.name}
            type="button"
            onClick={() => onAppClick(app.id)}
            style={{
              transform: `scale(${scale})`,
              zIndex: Math.round(scale * 10)
            }}
          >
            <span className="trivai-dock-icon">{app.icon}</span>
            <span className="trivai-dock-tooltip">{app.name}</span>
            {activeApp === app.id && <span className="trivai-dock-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
