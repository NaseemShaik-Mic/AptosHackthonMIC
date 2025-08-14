export {};

declare global {
  interface Window {
    aptos: {
      connect: () => Promise<{ address: string }>;
      disconnect: () => Promise<void>;
      account: () => Promise<{ address: string }>;
      signAndSubmitTransaction: (payload: any) => Promise<{ hash: string }>;
      isConnected?: () => Promise<boolean>;
      network?: () => Promise<{ name: string }>;
    };
  }
}
