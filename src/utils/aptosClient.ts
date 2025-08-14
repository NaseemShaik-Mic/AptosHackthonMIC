import { AptosClient } from "aptos";

const NODE = import.meta.env.VITE_APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com';
export const client = new AptosClient(NODE);
