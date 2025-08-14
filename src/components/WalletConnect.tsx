import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>;
      disconnect?: () => Promise<void>;
      account: () => Promise<{ address: string }>;
    };
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

const PETRA_EXTENSION_URL =
  "https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci";

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
}) => {
  const [address, setAddress] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aptosAddress");
    }
    return null;
  });
  const [connecting, setConnecting] = useState(false);

  const isInstalled = typeof window !== "undefined" && !!window.aptos;

  // Try to restore connection on mount
  useEffect(() => {
    if (isInstalled) {
      window.aptos
        .account()
        .then((acc) => {
          if (acc?.address) {
            setAddress(acc.address);
            localStorage.setItem("aptosAddress", acc.address);
            onConnect?.(acc.address);
          }
        })
        .catch(() => {
          // ignore error
        });
    }
  }, [isInstalled, onConnect]);

  const connect = async () => {
    if (!isInstalled) {
      window.open(PETRA_EXTENSION_URL, "_blank");
      return;
    }
    try {
      setConnecting(true);
      const res = await window.aptos!.connect();
      const addr = res.address || (await window.aptos!.account()).address;
      setAddress(addr);
      localStorage.setItem("aptosAddress", addr);
      onConnect?.(addr);
    } catch (e) {
      console.error("Petra connect failed", e);
      alert("Failed to connect to Petra wallet.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await window.aptos?.disconnect?.();
    } catch {
      // ignore errors on disconnect
    }
    setAddress(null);
    localStorage.removeItem("aptosAddress");
    onDisconnect?.();
  };

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="glass-panel" onClick={disconnect}>
            Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="hero"
      size="lg"
      className="animate-enter"
      onClick={connect}
      disabled={connecting}
    >
      {isInstalled ? (connecting ? "Connecting..." : "Connect Wallet") : "Install Petra"}
    </Button>
  );
};

export default WalletConnect;
