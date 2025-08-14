import { AptosClient } from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com"; // Devnet
const client = new AptosClient(NODE_URL);

export function useAptosWallet() {
  const connect = async () => {
    const res = await window.aptos.connect();
    return res.address;
  };

  const disconnect = async () => {
    await window.aptos.disconnect();
  };

  const signAndSubmitTransaction = async (payload: any) => {
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    await client.waitForTransaction(tx.hash);
    return tx;
  };

  const getAccount = async () => {
    return window.aptos.account();
  };

  return { connect, disconnect, signAndSubmitTransaction, getAccount };
}
