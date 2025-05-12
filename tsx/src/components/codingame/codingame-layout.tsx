import CustomCursor from "@/components/codingame/custom-cursor";
import Navbar from "@/components/codingame/navbar";
import BackgroundParticles from "@/components/codingame/particles-bg";

type LayoutProps = {
  children: React.ReactNode;
};

const CodingameLayout = ({ children }: LayoutProps) => {
  return (
    <div className="codingame relative min-h-screen overflow-hidden">
      <CustomCursor />
      <BackgroundParticles />

      <main className="flex flex-col items-center justify-center h-screen px-4 text-center">
        <Navbar />
        <section className="text-center py-5 px-4">{children}</section>
      </main>
    </div>
  );
};

export default CodingameLayout;
