"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

const BackgroundParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const particles = containerRef.current?.children;
    if (!particles) return;

    Array.from(particles).forEach((particle) => {
      const duration = 8 + Math.random() * 10;
      const delay = Math.random() * 5;
      const x = -100 + Math.random() * 200;
      const y = -100 + Math.random() * 200;

      gsap.to(particle, {
        x,
        y,
        opacity: 0.2 + Math.random() * 0.6,
        repeat: -1,
        yoyo: true,
        duration,
        delay,
        ease: "sine.inOut",
      });
    });
  }, []);

  useEffect(() => {
    const moveParticles = (e: MouseEvent) => {
      // setMouse({ x: e.clientX, y: e.clientY });

      const particles = containerRef.current?.children;
      if (!particles) return;

      Array.from(particles).forEach((particle) => {
        const factor = 40; // Diminuer le facteur pour moins de mouvement
        const rect = particle.getBoundingClientRect();
        const dx = (rect.left - e.clientX) / factor; // Plus petit mouvement horizontal
        const dy = (rect.top - e.clientY) / factor; // Plus petit mouvement vertical

        gsap.to(particle, {
          x: `+=${dx}`,
          y: `+=${dy}`,
          duration: 1,
          ease: "sine.out",
        });
      });
    };

    window.addEventListener("mousemove", moveParticles);
    return () => window.removeEventListener("mousemove", moveParticles);
  }, []);

  const particleCount = 60;
  const particles = Array.from({ length: particleCount });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10 overflow-hidden bg-slate-900"
    >
      {particles.map((_, i) => {
        const isCircle = Math.random() > 0.5;
        const size = 2 + Math.random() * 4;
        return (
          <div
            key={i}
            className={`absolute ${
              isCircle ? "rounded-full" : "rounded-sm"
            } bg-cyan-400 opacity-40`}
            style={{
              width: size,
              height: size,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        );
      })}
    </div>
  );
};

export default BackgroundParticles;
