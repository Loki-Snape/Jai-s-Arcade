export function createEngine(canvas, game) {
  const context = canvas.getContext('2d');
  if (!context) {
    return () => {};
  }

  const colors = ['#22d3ee', '#f97316', '#a78bfa', '#34d399', '#f43f5e'];
  const particles = Array.from({ length: 24 }, (_, index) => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 2 + (index % 4),
    speed: 0.5 + Math.random() * 1.25,
    hue: colors[index % colors.length]
  }));

  let animationFrame = 0;
  let running = true;

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = () => {
    if (!running) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    context.lineWidth = 1;
    for (let column = 0; column < 12; column += 1) {
      const x = (width / 12) * column;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    particles.forEach((particle, index) => {
      particle.y += particle.speed;
      if (particle.y > height + 12) {
        particle.y = -12;
        particle.x = Math.random() * width;
      }

      context.fillStyle = particle.hue;
      context.globalAlpha = 0.85;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;

      const trailWidth = 8 + index;
      context.fillStyle = 'rgba(255, 255, 255, 0.04)';
      context.fillRect(particle.x - trailWidth / 2, particle.y - trailWidth * 1.5, trailWidth, trailWidth * 1.5);
    });

    context.fillStyle = 'rgba(15, 23, 42, 0.85)';
    context.fillRect(18, 18, width - 36, 72);
    context.fillStyle = '#e2e8f0';
    context.font = '600 18px Inter, system-ui, sans-serif';
    context.fillText(game.title, 36, 48);
    context.font = '400 13px Inter, system-ui, sans-serif';
    context.fillText(game.mechanics, 36, 70);

    animationFrame = window.requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener('resize', resize);
  draw();

  return () => {
    running = false;
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener('resize', resize);
  };
}
