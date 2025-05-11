import { ReactNode } from "react";
import ParticlesBackground from "./particles-bg";

type LayoutProps = {
  children: ReactNode;
};

const CodingameLayout = ({ children }: LayoutProps) => {
  return (
    <div className="relative bg-background min-h-screen text-white overflow-hidden">
      <ParticlesBackground />
      {children}
    </div>
  );
};

export default CodingameLayout;
