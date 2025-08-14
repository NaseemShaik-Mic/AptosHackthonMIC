import { create } from 'ipfs-http-client';
const projectId = import.meta.env.VITE_IPFS_PROJECT_ID || '';
const projectSecret = import.meta.env.VITE_IPFS_PROJECT_SECRET || '';
const auth = projectId && projectSecret ? 'Basic ' + btoa(projectId + ':' + projectSecret) : undefined;

export const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  ...(auth ? { headers: { authorization: auth } } : {}),
});

export async function uploadToIPFS(file: File): Promise<string> {
  const added = await ipfs.add(file as any);
  return added.cid?.toString() || added.path || '';
}
