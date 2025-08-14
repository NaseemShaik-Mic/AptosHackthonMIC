import { useState, useEffect } from "react";
import {
  Shield, Upload, Share2, FileText, MessageSquare, 
  CheckCircle, AlertCircle, Loader2, Download, Eye,
  UserPlus, Trash2, Heart, Wallet, Copy, LogOut, Check,
  Settings, Bell, Search, Filter, Calendar, Clock,
  Lock, Unlock, Globe, Database, Cloud, Activity
} from "lucide-react";

// Mock blockchain constants
const MODULE_ADDR = "0xf430cd6ec35c1d5f4d908de0281326705cef62be4f634bbf6e5b8f12e3163135";

// Mock blockchain client
const client = {
  waitForTransaction: async (hash: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  },
  view: async (payload: any) => {
    if (payload.function.includes('get_records')) {
      return ["QmXXXXX", "QmYYYYY", "QmZZZZZ"];
    }
    if (payload.function.includes('get_record_metadata')) {
      return {
        filename: "Medical Report",
        file_size: 1024000,
        file_type: "application/pdf",
        upload_time: Date.now(),
        is_encrypted: true,
        category: "Lab Results",
        description: "Blood work results"
      };
    }
    if (payload.function.includes('get_patient_stats')) {
      return {
        total_records: 5,
        total_doctors_with_access: 2,
        last_upload_time: Date.now() - 86400000, // 1 day ago
        encryption_status: true
      };
    }
    return [];
  }
};

// Mock window.aptos
const mockAptos = {
  connect: async () => ({ address: "0x1234567890abcdef1234567890abcdef12345678" }),
  disconnect: async () => {},
  signAndSubmitTransaction: async (payload: any) => ({ hash: "0xmockhash" }),
  account: async () => ({ address: "0x1234567890abcdef1234567890abcdef12345678" })
};

if (typeof window !== 'undefined' && !window.aptos) {
  (window as any).aptos = mockAptos;
}

// Mock IPFS Configuration
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

async function uploadToIPFS(file: File): Promise<{ cid: string; url: string }> {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const mockCid = "Qm" + Math.random().toString(36).substring(2, 15);
  return {
    cid: mockCid,
    url: `${IPFS_GATEWAY}${mockCid}`
  };
}

async function chatWithServer({
  messages,
  account,
  cids,
}: {
  messages: { role: "user" | "ai"; text: string }[];
  account: string | null;
  cids: string[];
}) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const userMessage = messages[messages.length - 1]?.text || "";
  let reply = "I can help you with your health records. ";
  
  if (userMessage.toLowerCase().includes("record")) {
    reply += `You currently have ${cids.length} health records stored securely.`;
  } else if (userMessage.toLowerCase().includes("doctor") || userMessage.toLowerCase().includes("access")) {
    reply += "You can manage doctor access through the Access Control panel. Doctors can only view records you explicitly grant access to.";
  } else if (userMessage.toLowerCase().includes("upload")) {
    reply += "To upload a new record, use the upload section. Files are encrypted and stored on IPFS with metadata on the blockchain.";
  } else if (userMessage.toLowerCase().includes("secure") || userMessage.toLowerCase().includes("privacy")) {
    reply += "Your records are fully encrypted and stored on decentralized IPFS. Only you control who can access them.";
  } else if (userMessage.toLowerCase().includes("summary") || userMessage.toLowerCase().includes("overview")) {
    reply += `Based on your ${cids.length} records, I can provide insights about your health data patterns and trends.`;
  } else {
    reply += "I can help with uploading records, managing doctor access, explaining security features, and more. What would you like to know?";
  }
  
  return { reply };
}

// Contract integration functions
const grantAccess = async (patientAddress: string, doctorAddress: string) => {
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::health_record::grant_access`,
      type_arguments: [],
      arguments: [patientAddress, doctorAddress],
    };
    
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    await client.waitForTransaction(tx.hash);
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error('Grant access failed:', error);
    throw error;
  }
};

const revokeAccess = async (patientAddress: string, doctorAddress: string) => {
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::health_record::revoke_access`,
      type_arguments: [],
      arguments: [patientAddress, doctorAddress],
    };
    
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    await client.waitForTransaction(tx.hash);
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error('Revoke access failed:', error);
    throw error;
  }
};

const addRecordToContract = async (
  patientAddress: string,
  cid: string,
  filename: string,
  fileSize: number,
  fileType: string,
  category: string,
  description: string
) => {
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_ADDR}::health_record::add_record`,
      type_arguments: [],
      arguments: [
        patientAddress,
        cid,
        filename,
        fileSize.toString(),
        fileType,
        category,
        description
      ],
    };
    
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    await client.waitForTransaction(tx.hash);
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error('Add record failed:', error);
    throw error;
  }
};

const getPatientStats = async (patientAddress: string) => {
  try {
    const stats = await client.view({
      function: `${MODULE_ADDR}::health_record::get_patient_stats`,
      type_arguments: [],
      arguments: [patientAddress],
    });
    return stats;
  } catch (error) {
    console.error('Failed to fetch patient stats:', error);
    return null;
  }
};

// Types
interface HealthRecord {
  cid: string;
  filename: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
  category: string;
  description: string;
}

interface Doctor {
  id: number;
  address: string;
  name: string;
  specialty: string;
  verified: boolean;
  hospital: string;
  rating: number;
}

interface RecordMetadata {
  filename: string;
  file_size: number;
  file_type: string;
  upload_time: number;
  is_encrypted: boolean;
  category: string;
  description: string;
}

interface PatientStats {
  total_records: number;
  total_doctors_with_access: number;
  last_upload_time: number;
  encryption_status: boolean;
}

// Mock doctors with verification status
const mockDoctors: Doctor[] = [
  { 
    id: 1, 
    address: "0x1234567890abcdef1234567890abcdef12345678", 
    name: "Dr. Rajesh Singh", 
    specialty: "Cardiology", 
    verified: true,
    hospital: "Apollo Hospital",
    rating: 4.8
  },
  { 
    id: 2, 
    address: "0x2345678901bcdef12345678901cdef1234567890", 
    name: "Dr. Lisa Chen", 
    specialty: "Endocrinology", 
    verified: true,
    hospital: "Max Healthcare",
    rating: 4.9
  },
  { 
    id: 3, 
    address: "0x3456789012cdef123456789012def12345678901", 
    name: "Dr. Maria Morales", 
    specialty: "General Medicine", 
    verified: false,
    hospital: "City Hospital",
    rating: 4.5
  },
  {
    id: 4,
    address: "0x4567890123def1234567890123ef1234567890123",
    name: "Dr. Kumar Patel",
    specialty: "Orthopedics",
    verified: true,
    hospital: "AIIMS",
    rating: 4.7
  }
];

// Enhanced Iridescence Background Component
const EnhancedBackground = ({ className = "" }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
  }>>([]);

  useEffect(() => {
    // Create floating particles with different colors
    const colors = ['cyan', 'purple', 'blue', 'pink', 'indigo'];
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 6 + 2,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      opacity: Math.random() * 0.6 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.speedX + window.innerWidth) % window.innerWidth,
        y: (particle.y + particle.speedY + window.innerHeight) % window.innerHeight,
      })));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`} style={{ zIndex: -1 }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-800/40 via-transparent to-cyan-800/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/30 via-transparent to-pink-800/30"></div>
      </div>
      
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`absolute rounded-full bg-${particle.color}-400/30 blur-sm animate-pulse`}
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
        />
      ))}
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/2 to-transparent"></div>
      
      {/* Animated aurora effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>
    </div>
  );
};

// Navigation function to go back to index
const navigateToHome = () => {
  // In a real React Router setup, you'd use navigate('/')
  // For demo purposes, we'll simulate navigation
  window.location.href = './index.tsx';
};

// Enhanced Wallet Connect Component
const WalletConnect = ({ onDisconnect, address = "" }) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const handleDisconnect = () => {
    onDisconnect();
    setShowDropdown(false);
    navigateToHome(); // Navigate back to index page
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 bg-white/15 text-white border border-white/25 rounded-xl flex items-center gap-2 hover:bg-white/25 backdrop-blur-lg transition-all duration-300 shadow-lg"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">{formatAddress(address)}</span>
        <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-400/30">
          Connected
        </span>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white/5 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 z-50">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">Wallet Address</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
                Aptos Network
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <code className="text-xs bg-black/20 text-gray-200 px-3 py-2 rounded-lg flex-1 truncate border border-white/10">
                {address}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Copy Address"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-300" />
                )}
              </button>
            </div>
          </div>
          
          <div className="border-t border-white/10 px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Balance</span>
              <span className="text-xs text-gray-400">APT</span>
            </div>
            <div className="text-xl font-bold text-white">0.00</div>
          </div>
          
          <div className="border-t border-white/10 px-5 py-3">
            <div className="text-sm text-gray-300 mb-2">Network Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-300">Connected to Aptos Mainnet</span>
            </div>
          </div>
          
          <div className="border-t border-white/10">
            <button 
              onClick={handleDisconnect}
              className="w-full px-5 py-4 text-left text-red-400 hover:bg-red-500/10 rounded-b-2xl flex items-center gap-3 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Disconnect & Return Home</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-${color}-500/20 border border-${color}-400/30`}>
          <Icon className={`h-5 w-5 text-${color}-300`} />
        </div>
        <div>
          <div className="text-xs text-gray-300">{title}</div>
          <div className="text-lg font-bold text-white">{value}</div>
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [account, setAccount] = useState<string | null>(null);
  const [access, setAccess] = useState<Record<number, boolean>>({});
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm your AI health assistant. I can help you understand your health records, manage access permissions, and provide insights. How can I help you today?" },
  ]);
  const [newRecordCategory, setNewRecordCategory] = useState("Lab Results");
  const [newRecordDescription, setNewRecordDescription] = useState("");
  const [accessLoading, setAccessLoading] = useState<Record<number, boolean>>({});
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [isTyping, setIsTyping] = useState(false);

  const connectWallet = async () => {
    try {
      const res = await window.aptos.connect();
      setAccount(res.address);
      await initializeAccount(res.address);
      await fetchPatientStats(res.address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    await window.aptos.disconnect();
    setAccount(null);
    setRecords([]);
    setAccess({});
    setPatientStats(null);
  };

  const initializeAccount = async (address: string) => {
    try {
      await signAndSubmitTransaction({
        type: "entry_function_payload",
        function: `${MODULE_ADDR}::health_record::init_patient_account`,
        type_arguments: [],
        arguments: [],
      });
    } catch (error) {
      console.log('Account initialization:', error);
    }
  };

  const signAndSubmitTransaction = async (payload: any) => {
    const tx = await window.aptos.signAndSubmitTransaction(payload);
    await client.waitForTransaction(tx.hash);
    return tx;
  };

  const fetchPatientStats = async (address: string) => {
    try {
      const stats = await getPatientStats(address);
      setPatientStats(stats);
    } catch (error) {
      console.error('Failed to fetch patient stats:', error);
    }
  };

  const fetchRecords = async () => {
    if (!account) return;
    try {
      const cids = await client.view({
        function: `${MODULE_ADDR}::health_record::get_records`,
        type_arguments: [],
        arguments: [account, account],
      }) as string[];
      
      const recordsWithMetadata: HealthRecord[] = await Promise.all(
        cids.map(async (cid, index) => {
          try {
            const metadata = await client.view({
              function: `${MODULE_ADDR}::health_record::get_record_metadata`,
              type_arguments: [],
              arguments: [account, cid, account],
            }) as RecordMetadata;
            
            return {
              cid,
              filename: metadata.filename,
              uploadDate: new Date(metadata.upload_time * 1000).toISOString().split('T')[0],
              fileSize: metadata.file_size,
              fileType: metadata.file_type,
              category: metadata.category,
              description: metadata.description
            };
          } catch {
            return {
              cid,
              filename: `Health Record ${index + 1}`,
              uploadDate: new Date().toISOString().split('T')[0],
              fileSize: 0,
              fileType: 'unknown',
              category: 'General',
              description: 'No description available'
            };
          }
        })
      );
      
      setRecords(recordsWithMetadata);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    if (!newRecordDescription.trim()) {
      setUploadStatus({ type: 'error', message: 'Please provide a description for the record.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Upload to IPFS
      const { cid } = await uploadToIPFS(file);
      
      // Add record to blockchain using contract function
      await addRecordToContract(
        account,
        cid,
        file.name,
        file.size,
        file.type,
        newRecordCategory,
        newRecordDescription
      );

      await fetchRecords();
      await fetchPatientStats(account);
      
      setUploadStatus({ 
        type: 'success', 
        message: `File uploaded successfully! CID: ${cid.substring(0, 20)}...` 
      });
      
      e.target.value = '';
      setNewRecordDescription('');
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({ 
        type: 'error', 
        message: 'Upload failed. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAccess = async (doctorId: number, doctorAddr: string, value: boolean) => {
    if (!account) return;
    
    setAccessLoading(prev => ({ ...prev, [doctorId]: true }));
    
    try {
      if (value) {
        await grantAccess(account, doctorAddr);
      } else {
        await revokeAccess(account, doctorAddr);
      }
      
      setAccess((a) => ({ ...a, [doctorId]: value }));
      await fetchPatientStats(account);
    } catch (error) {
      console.error('Access toggle failed:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `Failed to ${value ? 'grant' : 'revoke'} access. Please try again.` 
      });
    } finally {
      setAccessLoading(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages((m) => [...m, { role: "user", text }]);
    setIsTyping(true);
    
    try {
      const { reply } = await chatWithServer({
        messages: [...messages, { role: "user", text }],
        account,
        cids: records.map(r => r.cid),
      });
      
      setIsTyping(false);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch {
      setIsTyping(false);
      setMessages((m) => [...m, { role: "ai", text: "Sorry—chat service failed. Please try again." }]);
    }
  };

  const viewRecord = (cid: string) => {
    window.open(`${IPFS_GATEWAY}${cid}`, '_blank');
  };

  const downloadRecord = async (cid: string, filename: string) => {
    try {
      const response = await fetch(`${IPFS_GATEWAY}${cid}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const deleteRecord = async (cid: string) => {
    if (!account || !confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    
    try {
      await signAndSubmitTransaction({
        type: "entry_function_payload",
        function: `${MODULE_ADDR}::health_record::delete_record`,
        type_arguments: [],
        arguments: [cid],
      });
      
      await fetchRecords();
      await fetchPatientStats(account);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || record.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (account) {
      fetchRecords();
      fetchPatientStats(account);
    }
  }, [account]);

  const categories = ["All", "Lab Results", "Medical Images", "Prescriptions", "Consultation Notes", "Insurance", "Other"];

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      <EnhancedBackground className="absolute inset-0 z-0" />

      <header className="flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur-2xl z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-400/30">
            <Shield className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <span className="font-bold text-xl text-white">CuraVault</span>
            <div className="text-xs text-gray-300">Decentralized Health Records</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!account ? (
            <button 
              onClick={connectWallet}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-medium"
            >
              Connect Wallet
            </button>
          ) : (
            <WalletConnect onDisconnect={disconnectWallet} address={account} />
          )}
          <button className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      {account && patientStats && (
        <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            icon={FileText} 
            title="Total Records" 
            value={patientStats.total_records || records.length}
            color="blue"
          />
          <StatsCard 
            icon={UserPlus} 
            title="Doctors with Access" 
            value={patientStats.total_doctors_with_access || Object.values(access).filter(Boolean).length}
            color="green"
          />
          <StatsCard 
            icon={Lock} 
            title="Encryption Status" 
            value={patientStats.encryption_status ? "Enabled" : "Disabled"}
            color="purple"
          />
          <StatsCard 
            icon={Clock} 
            title="Last Upload" 
            value={patientStats.last_upload_time ? new Date(patientStats.last_upload_time).toLocaleDateString() : "Never"}
            color="cyan"
          />
        </div>
      )}

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 z-10">
        
        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-400" /> 
              Secure IPFS Upload
            </h3>
            <p className="text-sm text-gray-300 mt-1">Upload your health records securely to IPFS</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Record Category</label>
              <select 
                value={newRecordCategory} 
                onChange={(e) => setNewRecordCategory(e.target.value)}
                className="w-full px-3 py-3 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 text-white backdrop-blur-sm transition-all"
                disabled={!account}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Description</label>
              <textarea
                value={newRecordDescription}
                onChange={(e) => setNewRecordDescription(e.target.value)}
                placeholder="Describe this health record in detail..."
                className="w-full px-3 py-3 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 h-24 resize-none text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                disabled={!account}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Choose File</label>
              <input 
                type="file" 
                onChange={handleUpload} 
                disabled={isUploading || !account}
                accept=".pdf,.jpg,.jpeg,.png,.txt,.docx,.dicom"
                className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 text-gray-200 backdrop-blur-sm transition-all"
              />
            </div>
            
            {isUploading && (
              <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <div>
                  <div className="text-sm font-medium text-cyan-300">Uploading...</div>
                  <div className="text-xs text-gray-300">Encrypting and storing on IPFS & blockchain</div>
                </div>
              </div>
            )}
            
            {uploadStatus.type && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 backdrop-blur-sm ${
                uploadStatus.type === 'success' 
                  ? 'border-green-400/30 bg-green-500/10 text-green-300' 
                  : 'border-red-400/30 bg-red-500/10 text-red-300'
              }`}>
                {uploadStatus.type === 'success' ? 
                  <CheckCircle className="h-5 w-5 flex-shrink-0" /> : 
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                }
                <div>
                  <div className="text-sm font-medium">
                    {uploadStatus.type === 'success' ? 'Upload Successful!' : 'Upload Failed'}
                  </div>
                  <div className="text-xs opacity-90">{uploadStatus.message}</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <Shield className="h-4 w-4 text-blue-300" /> 
              <div className="text-xs text-blue-200">
                <div className="font-medium">End-to-end encrypted</div>
                <div>Files stored on IPFS, metadata on Aptos blockchain</div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Access Control */}
        <div className="bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-400" /> 
              Doctor Access Control
            </h3>
            <p className="text-sm text-gray-300 mt-1">Manage who can access your health records</p>
          </div>
          <div className="p-6 space-y-4">
            {mockDoctors.map((doctor) => (
              <div key={doctor.id} className="border border-white/20 rounded-xl p-4 bg-black/10 backdrop-blur-sm hover:bg-black/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {doctor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{doctor.name}</span>
                          {doctor.verified && (
                            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-green-400/30">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-300">{doctor.specialty} • {doctor.hospital}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${i < Math.floor(doctor.rating) ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 ml-1">{doctor.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono bg-black/20 px-2 py-1 rounded truncate">
                      {doctor.address}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {accessLoading[doctor.id] && (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!access[doctor.id]}
                        onChange={(e) => toggleAccess(doctor.id, doctor.address, e.target.checked)}
                        disabled={!account || accessLoading[doctor.id]}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/30 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500 disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center py-4">
              <button className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm flex items-center gap-2 mx-auto">
                <UserPlus className="h-4 w-4" />
                Add New Doctor
              </button>
            </div>
          </div>
        </div>

        {/* Health Records */}
        <div className="bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-400" /> 
                  My Health Records ({filteredRecords.length})
                </h3>
                <p className="text-sm text-gray-300 mt-1">Your secure health data archive</p>
              </div>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400 text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400 text-white backdrop-blur-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="p-6">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-gray-300 mb-2">
                  {records.length === 0 ? "No records found" : "No records match your search"}
                </div>
                <div className="text-sm text-gray-400">
                  {records.length === 0 ? "Upload your first health record to get started" : "Try adjusting your search terms or filters"}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredRecords.map((record, i) => (
                  <div key={i} className="border border-white/20 rounded-xl p-4 bg-black/10 backdrop-blur-sm hover:bg-black/20 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{record.filename}</span>
                          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-400/30">
                            {record.category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 mb-2">
                          <div className="flex items-center gap-4">
                            <span>📅 {record.uploadDate}</span>
                            <span>📏 {(record.fileSize / 1024).toFixed(1)} KB</span>
                            <span>🔗 {record.cid.substring(0, 8)}...</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-300 bg-black/20 p-2 rounded-lg">
                          {record.description}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => viewRecord(record.cid)}
                          className="p-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-400/30"
                          title="View Record"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => downloadRecord(record.cid, record.filename)}
                          className="p-2 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-lg transition-colors border border-green-400/30"
                          title="Download Record"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteRecord(record.cid)}
                          className="p-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg transition-colors border border-red-400/30"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Health Assistant */}
        <div className="bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20 shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-400" /> 
              AI Health Assistant
            </h3>
            <p className="text-sm text-gray-300 mt-1">Get insights about your health records</p>
          </div>
          <div className="p-6">
            <div className="h-80 border border-white/20 rounded-xl p-4 overflow-auto space-y-3 bg-black/10 backdrop-blur-sm mb-4 scrollbar-thin scrollbar-thumb-white/20">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-sm p-3 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      : "bg-gray-700/50 text-gray-200 border border-gray-600/30"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700/50 text-gray-200 border border-gray-600/30 p-3 rounded-2xl flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask about your health records, trends, or insights..."
                disabled={!account || (records.length === 0 && !isTyping)}
                className="flex-1 px-4 py-3 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-400 disabled:opacity-50 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) {
                      sendMessage(v);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <button
                disabled={!account || (records.length === 0 && !isTyping)}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>(
                    'input[placeholder="Ask about your health records, trends, or insights..."]'
                  );
                  if (el && el.value.trim()) {
                    sendMessage(el.value.trim());
                    el.value = "";
                  }
                }}
              >
                Send
              </button>
            </div>
            
            {records.length === 0 && account && (
              <div className="text-center mt-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl">
                <div className="text-xs text-yellow-300 font-medium">💡 Pro Tip</div>
                <div className="text-xs text-yellow-200 mt-1">
                  Upload some health records to unlock personalized AI insights and recommendations!
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="p-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <span>System Status: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span>Aptos Network</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-purple-400" />
              <span>IPFS Gateway</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Powered by Aptos Blockchain & IPFS
          </div>
        </div>
      </footer>
    </div>
  );
}