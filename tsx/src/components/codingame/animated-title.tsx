"use client";
import gsap from "gsap";
import { useEffect, useRef } from "react";

const AnimatedTitle = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <h1
      ref={titleRef}
      className="text-5xl font-extrabold text-primary text-center mb-6"
    >
      Préparez vos entretiens avec IA
    </h1>
  );
};

export default AnimatedTitle;
