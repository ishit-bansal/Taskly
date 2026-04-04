import confetti from 'canvas-confetti';

export function celebrateTaskCompletion() {
  const defaults = {
    spread: 70,
    ticks: 100,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: 25,
    colors: ['#6366f1', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
  };

  confetti({
    ...defaults,
    particleCount: 40,
    scalar: 1.2,
    shapes: ['star'],
    origin: { x: 0.5, y: 0.6 },
  });

  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 30,
      scalar: 0.8,
      shapes: ['circle'],
      origin: { x: 0.3, y: 0.5 },
    });
  }, 150);

  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 30,
      scalar: 0.8,
      shapes: ['circle'],
      origin: { x: 0.7, y: 0.5 },
    });
  }, 300);
}

export function celebrateSubtle() {
  confetti({
    particleCount: 15,
    spread: 50,
    startVelocity: 15,
    gravity: 1.2,
    ticks: 60,
    colors: ['#22c55e', '#6366f1'],
    origin: { x: 0.85, y: 0.3 },
    scalar: 0.7,
  });
}
