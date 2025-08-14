import TextType from './TextType';
import Galaxy from "./Galaxy";
import { WalletConnect } from "@/components/WalletConnect";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Decentralized Storage",
    description:
      "Your health records are encrypted and securely stored on IPFS, ensuring privacy and permanence.",
    icon: "🔒",
  },
  {
    title: "AI Insights",
    description:
      "Get real-time AI-powered insights and summaries on your health data for proactive care.",
    icon: "🤖",
  },
  {
    title: "Share with Doctors",
    description:
      "Easily grant or revoke secure access to healthcare professionals — always in your control.",
    icon: "👨‍⚕️",
  },
  {
    title: "Powered by Aptos",
    description:
      "All your data interactions and access permissions are verified on the Aptos blockchain.",
    icon: "⛓️",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* GALAXY BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="container py-6 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-b-xl">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tight text-white drop-shadow-sm select-none font-sans italic">
              CuraVallet
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WalletConnect onConnect={() => navigate("/dashboard")} />
          </div>
        </header>

        {/* HERO SECTION */}
        <main className="container flex flex-col items-center justify-center flex-1 text-center py-16">
          {/* Dynamic Typing Heading */}
        <div className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight max-w-3xl text-black drop-shadow-md mb-4">
          <TextType
            text={["DECENTRALIZED-AI", "Health Wallet", "Empowering Patients"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            textColors={["#4F46E5", "#8B5CF6", "#A78BFA"]}
            cursorCharacter="|"
          />
        </div>

          {/* Supporting Paragraph */}
          <p className="mt-6 text-lg md:text-xl text-black max-w-2xl drop-shadow-sm">
            Securely upload your records to IPFS, share access with your doctors,
            and get instant AI-powered health insights
          </p>
        </main>

        {/* FEATURE CARDS */}
        <section className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-white/80 rounded-xl shadow-lg p-6 flex flex-col items-center text-center backdrop-blur animate-fade-in"
            >
              <div className="text-3xl mb-3">{feat.icon}</div>
              <div className="font-bold text-lg mb-2">{feat.title}</div>
              <div className="text-sm text-muted-foreground">
                {feat.description}
              </div>
            </div>
          ))}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border/20 py-6 text-center text-sm text-purple/80 bg-black/30 backdrop-blur">
          © {new Date().getFullYear()} CuraVallet — Empowering Patients with Blockchain
        </footer>
      </div>
    </div>
  );
};

export default Index;
