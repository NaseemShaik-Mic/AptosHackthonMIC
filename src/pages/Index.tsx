import React, { useState, useEffect } from 'react';
import TextType from './TextType';
import Galaxy from "./Galaxy";
import { WalletConnect } from "@/components/WalletConnect";
import { useNavigate } from "react-router-dom";
// Import contract functions (adjust paths as needed)
// import { grantAccess, revokeAccess } from './contract/sources/access';
// import { uploadReport } from './contract/sources/upload';

const features = [
  {
    title: "Decentralized Storage",
    description:
      "Your health records are encrypted and securely stored on IPFS, ensuring privacy and permanence.",
    icon: "🔒",
    action: "upload"
  },
  {
    title: "AI Insights",
    description:
      "Get real-time AI-powered insights and summaries on your health data for proactive care.",
    icon: "🤖",
    action: "insights"
  },
  {
    title: "Share with Doctors",
    description:
      "Easily grant or revoke secure access to healthcare professionals — always in your control.",
    icon: "👨‍⚕️",
    action: "access"
  },
  {
    title: "Powered by Aptos",
    description:
      "All your data interactions and access permissions are verified on the Aptos blockchain.",
    icon: "⛓️",
    action: "blockchain"
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState({});

  // Check wallet connection status on mount
  useEffect(() => {
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      // Add your wallet connection check logic here
      // This is a placeholder - replace with actual wallet check
      const connected = localStorage.getItem('walletConnected') === 'true';
      const address = localStorage.getItem('walletAddress') || '';
      setIsConnected(connected);
      setWalletAddress(address);
    };
    
    checkWalletConnection();
  }, []);

  const handleWalletAction = async () => {
    if (isConnected) {
      // Disconnect wallet
      setIsConnected(false);
      setWalletAddress("");
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      // Navigate back to index
      navigate("/");
    } else {
      // Connect wallet
      try {
        setLoading({ wallet: true });
        // Add your wallet connection logic here
        // This is a placeholder - replace with actual wallet connection
        const mockAddress = "0x1234...5678"; // Replace with actual connection result
        setIsConnected(true);
        setWalletAddress(mockAddress);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', mockAddress);
        navigate("/dashboard");
      } catch (error) {
        console.error("Wallet connection failed:", error);
      } finally {
        setLoading({ wallet: false });
      }
    }
  };

  const handleFeatureAction = async (action) => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setLoading({ [action]: true });
    
    try {
      switch (action) {
        case 'upload':
          // Call upload contract function
          // const result = await uploadReport(reportData);
          console.log("Uploading report to blockchain...");
          // Add file picker logic here
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              // Call your contract upload function
              // await uploadReport(file);
              console.log("File selected for upload:", file.name);
              alert("Report upload initiated! (Contract function would be called here)");
            }
          };
          input.click();
          break;
          
        case 'access':
          // Show access management modal or navigate to access page
          const action = confirm("Grant access to a new doctor? (Cancel for revoke access)");
          if (action) {
            // Grant access
            const doctorAddress = prompt("Enter doctor's wallet address:");
            if (doctorAddress) {
              // await grantAccess(doctorAddress);
              console.log("Granting access to:", doctorAddress);
              alert(`Access granted to ${doctorAddress} (Contract function would be called here)`);
            }
          } else {
            // Revoke access
            const doctorAddress = prompt("Enter doctor's wallet address to revoke:");
            if (doctorAddress) {
              // await revokeAccess(doctorAddress);
              console.log("Revoking access from:", doctorAddress);
              alert(`Access revoked from ${doctorAddress} (Contract function would be called here)`);
            }
          }
          break;
          
        case 'insights':
          alert("AI Insights feature coming soon!");
          break;
          
        case 'blockchain':
          alert("Blockchain verification in progress!");
          break;
      }
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading({ [action]: false });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* ENHANCED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100"></div>
        
        {/* Animated mesh gradient overlay */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-transparent to-cyan-400/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-300/10 to-transparent"></div>
        </div>
        
        {/* Galaxy component */}
        <div className="absolute inset-0 opacity-25">
          <Galaxy
            mouseRepulsion={true}
            mouseInteraction={true}
            density={1.8}
            glowIntensity={0.6}
            saturation={0.9}
            hueShift={180}
          />
        </div>
        
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-300/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-cyan-300/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-teal-300/20 rounded-full blur-xl animate-bounce" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="container py-6 flex items-center justify-between">
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 shadow-lg border border-white/30">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black tracking-tight text-gray-800 drop-shadow-sm select-none font-sans italic">
                CuraVallet
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-2 shadow-lg border border-white/30">
              {isConnected && (
                <div className="text-xs text-gray-600 mr-3 px-2 py-1 bg-white/40 rounded-lg">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </div>
              )}
              <button
                onClick={handleWalletAction}
                disabled={loading.wallet}
                className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isConnected
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25'
                } ${loading.wallet ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading.wallet ? '...' : (isConnected ? 'Disconnect' : 'Connect Wallet')}
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <main className="container flex flex-col items-center justify-center flex-1 text-center py-16">
          {/* Dynamic Typing Heading */}
          <div className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight max-w-3xl text-gray-800 drop-shadow-md mb-4">
            <TextType
              text={["DECENTRALIZED-AI", "Health Wallet", "Empowering Patients"]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              textColors={["#059669", "#0891B2", "#0F766E"]}
              cursorCharacter="|"
            />
          </div>

          {/* Supporting Paragraph */}
          <div className="mt-6 text-lg md:text-xl text-gray-700 max-w-2xl drop-shadow-sm bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
            <p>
              Securely upload your records to IPFS, share access with your doctors,
              and get instant AI-powered health insights
            </p>
          </div>

          {/* Connection Status */}
          {isConnected && (
            <div className="mt-4 px-4 py-2 bg-emerald-100/80 backdrop-blur-sm text-emerald-800 rounded-xl border border-emerald-200/50">
              ✅ Wallet Connected - Ready to use features below
            </div>
          )}
        </main>

        {/* FEATURE CARDS */}
        <section className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl p-6 flex flex-col items-center text-center border border-white/40 hover:bg-white/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => handleFeatureAction(feat.action)}
            >
              {loading[feat.action] && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              )}
              
              <div className="text-4xl mb-4 filter drop-shadow-sm">{feat.icon}</div>
              <div className="font-bold text-lg mb-3 text-gray-800">{feat.title}</div>
              <div className="text-sm text-gray-600 mb-4">
                {feat.description}
              </div>
              
              {/* Action indicator */}
              <div className="mt-auto">
                <div className="px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-medium">
                  {isConnected ? 'Click to use' : 'Connect wallet first'}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/30 py-6 text-center text-sm text-gray-600 bg-white/10 backdrop-blur-sm">
          <div className="container">
            © {new Date().getFullYear()} CuraVallet — Empowering Patients with Blockchain
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;