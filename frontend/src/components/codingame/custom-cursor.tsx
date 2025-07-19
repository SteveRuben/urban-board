"use client";
import { useEffect } from "react";

const CustomCursor = () => {
  useEffect(() => {
    const cursor = document.createElement("div");
    cursor.style.position = "fixed";
    cursor.style.width = "12px";
    cursor.style.height = "12px";
    cursor.style.borderRadius = "50%";
    cursor.style.backgroundColor = "#fff";
    cursor.style.pointerEvents = "none";
    cursor.style.zIndex = "9999";
    cursor.style.transform = "translate(-50%, -50%)";
    cursor.style.transition = "background-color 0.3s ease";
    document.body.appendChild(cursor);

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", move);

    // Changer la couleur du curseur en fonction de l'élément survolé
    document.querySelectorAll(".hover-target").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.style.backgroundColor = "rgba(167, 139, 250, 0.3)";
      });
      el.addEventListener("mouseleave", () => {
        cursor.style.backgroundColor = "rgba(56, 189, 248, 0.3)";
      });
    });

    return () => {
      window.removeEventListener("mousemove", move);
      document.body.removeChild(cursor);
    };
  }, []);

  return null;
};

export default CustomCursor;
