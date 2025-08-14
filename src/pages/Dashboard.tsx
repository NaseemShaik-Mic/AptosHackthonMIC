import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield, Upload, Share2, FileText, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Mock components for demo
const WalletConnect = ({ onDisconnect }: { onDisconnect: () => void }) => (
  <Button variant="outline" onClick={onDisconnect}>Disconnect</Button>
);

const Iridescence = ({ children, ...props }: any) => (
  <div className="bg-gradient-to-br from-blue-50 to-purple-50" {...props}>
    {children}
  </div>
);

const SplitText = ({ text, className, ...props }: any) => (
  <h1 className={className}>{text}</h1>
);

// Enhanced blockchain & IPFS setup with error handling
const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
const MODULE_ADDR = "0x1"; // Placeholder - replace with actual deployed address

// Mock doctors with more realistic data
const mockDoctors = [
  { 
    id: 1, 
    address: "0xbf00ef2e28824a0b81439fbfb8f5b0d8fb932649dc625c4df5670197b083ccfe", 
    name: "Dr. Singh", 
    specialty: "Cardiology",
    verified: true
  },
  { 
    id: 2, 
    address: "0x2f86cffa28b74ff5b04142c5c328368a6ce4763ae70137022a393d84a4ab3003", 
    name: "Dr. Chen", 
    specialty: "Endocrinology",
    verified: true
  },
  { 
    id: 3, 
    address: "0x3c75f6a8d9b5e2f1a0c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6", 
    name: "Dr. Morales", 
    specialty: "General Medicine",
    verified: false
  },
];

// Enhanced utility functions with proper error handling
function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, PDF, and TXT files are allowed' };
  }
  
  return { valid: true };
}

async function simulateIPFSUpload(file: File): Promise<string> {
  // Simulate IPFS upload delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a mock CID based on file properties
  const timestamp = Date.now();
  const fileInfo = `${file.name}-${file.size}-${timestamp}`;
  const mockCID = `Qm${btoa(fileInfo).replace(/[^a-zA-Z0-9]/g, '').substring(0, 44)}`;
  
  return mockCID;
}

async function simulateBlockchainTransaction(operation: string, args: any[]): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate occasional failures for realism
  if (Math.random() < 0.1) { // 10% failure rate
    return { 
      success: false, 
      error: `${operation} failed: Network congestion. Please try again.` 
    };
  }
  
  // Generate mock transaction hash
  const hash = `0x${Math.random().toString(16).substring(2, 66)}`;
  
  return { success: true, hash };
}

export default function Dashboard() {
  const [account, setAccount] = useState<string | null>("0x1234...mock"); // Mock connected account
  const [records, setRecords] = useState<Array<{ cid: string; filename: string; uploadDate: string; fileType: string }>>([]);
  const [access, setAccess] = useState<Record<number, boolean>>({});
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! Ask me anything about your health records. I can help analyze your uploaded files and provide insights." },
  ]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState<Record<number, boolean>>({});

  // Initialize with some mock data
  useEffect(() => {
    if (account) {
      // Simulate existing records
      setRecords([
        {
          cid: "QmExampleCID1234567890abcdef",
          filename: "blood_test_2024.pdf",
          uploadDate: "2024-08-10",
          fileType: "application/pdf"
        }
      ]);
      
      // Mock some doctor access
      setAccess({ 1: true, 2: false, 3: false });
    }
  }, [account]);

  // Enhanced file upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    // Reset error state
    setUploadError(null);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error!);
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload to IPFS (simulated)
      console.log("Uploading to IPFS...");
      const cid = await simulateIPFSUpload(file);
      console.log("IPFS upload successful, CID:", cid);

      // Step 2: Store CID on blockchain (simulated)
      console.log("Storing CID on blockchain...");
      const txResult = await simulateBlockchainTransaction("add_record", [cid]);
      
      if (!txResult.success) {
        throw new Error(txResult.error);
      }

      console.log("Blockchain transaction successful, hash:", txResult.hash);

      // Step 3: Update local state
      const newRecord = {
        cid,
        filename: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: file.type
      };

      setRecords(prev => [...prev, newRecord]);
      
      // Show success message
      alert(`File "${file.name}" uploaded successfully!\nTransaction: ${txResult.hash}`);
      
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Enhanced doctor access toggle
  const toggleAccess = async (doctorId: number, doctorAddr: string, value: boolean) => {
    if (!account) return;

    setAccessLoading(prev => ({ ...prev, [doctorId]: true }));

    try {
      const operation = value ? "grant_access" : "revoke_access";
      console.log(`${operation} for doctor:`, doctorAddr);
      
      const txResult = await simulateBlockchainTransaction(operation, [doctorAddr]);
      
      if (!txResult.success) {
        throw new Error(txResult.error);
      }

      // Update local state only after successful transaction
      setAccess(prev => ({ ...prev, [doctorId]: value }));
      
      const doctor = mockDoctors.find(d => d.id === doctorId);
      alert(`Successfully ${value ? 'granted' : 'revoked'} access ${value ? 'to' : 'from'} ${doctor?.name}`);
      
    } catch (err: any) {
      console.error("Access toggle failed:", err);
      alert(`Failed to ${value ? 'grant' : 'revoke'} access: ${err.message}`);
    } finally {
      setAccessLoading(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  // Enhanced chat functionality
  const sendMessage = async (text: string) => {
    const userMessage = { role: "user" as const, text };
    const loadingMessage = { role: "ai" as const, text: "Analyzing your question..." };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    
    try {
      // Simulate AI processing with context awareness
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let aiResponse = "";
      
      // Simple context-aware responses
      if (text.toLowerCase().includes('blood') || text.toLowerCase().includes('lab')) {
        aiResponse = `Based on your uploaded records, I can see you have blood test results from ${records[0]?.uploadDate}. Your recent tests show normal ranges for most parameters. Would you like me to explain any specific values?`;
      } else if (text.toLowerCase().includes('doctor') || text.toLowerCase().includes('access')) {
        const grantedDoctors = mockDoctors.filter(d => access[d.id]).map(d => d.name);
        aiResponse = grantedDoctors.length > 0 
          ? `You currently have ${grantedDoctors.length} doctors with access: ${grantedDoctors.join(', ')}. They can view your records and provide consultations.`
          : "You haven't granted access to any doctors yet. You can manage doctor access in the dashboard.";
      } else {
        aiResponse = "I'm here to help with your health records. You can ask me about your test results, doctor access, or general health questions. What specific information are you looking for?";
      }
      
      setMessages(prev => 
        prev.map((msg, idx) => 
          idx === prev.length - 1 ? { ...msg, text: aiResponse } : msg
        )
      );
      
    } catch (err) {
      setMessages(prev =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 
            ? { ...msg, text: "Sorry, I'm having trouble processing your request. Please try again." }
            : msg
        )
      );
    }
  };

  const connectWallet = () => {
    // Mock wallet connection
    setAccount("0x1234567890abcdef1234567890abcdef12345678");
    alert("Wallet connected successfully!");
  };

  const disconnectWallet = () => {
    setAccount(null);
    setRecords([]);
    setAccess({});
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      <Iridescence className="absolute inset-0 z-0" />

      <header className="flex justify-between items-center px-6 py-4 bg-white/20 backdrop-blur-md z-10">
        <SplitText
          text="CuraVault"
          className="text-3xl font-extrabold tracking-tight text-gray-800"
        />
        <div className="flex items-center gap-3">
          {!account ? (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              <WalletConnect onDisconnect={disconnectWallet} />
            </div>
          )}
          <Button variant="outline" className="bg-white/30 text-black" onClick={() => setHelpOpen(true)}>
            Help
          </Button>
        </div>
      </header>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Health Dashboard Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">File Upload</h4>
              <p>Upload medical files (PDF, images) up to 10MB. Files are encrypted and stored securely.</p>
            </div>
            <div>
              <h4 className="font-semibold">Doctor Access</h4>
              <p>Grant or revoke access for doctors to view your medical records.</p>
            </div>
            <div>
              <h4 className="font-semibold">AI Assistant</h4>
              <p>Ask questions about your health records and get AI-powered insights.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 z-10">
        {/* Enhanced Upload Card */}
        <Card className="bg-white/60 backdrop-blur-lg text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> 
              Secure File Upload
              {uploading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input 
              type="file" 
              onChange={handleUpload} 
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.txt"
            />
            {uploading && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                Uploading file and storing on blockchain...
              </div>
            )}
            {uploadError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
            <div className="text-sm flex items-center gap-2 text-gray-700">
              <Shield className="h-4 w-4" /> 
              Supports PDF, JPEG, PNG, TXT files (max 10MB). Files are encrypted & stored on IPFS.
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Doctor Access Card */}
        <Card className="bg-white/60 backdrop-blur-lg text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" /> Doctor Access Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDoctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between border rounded-md p-3 bg-white/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{doctor.name}</div>
                    {doctor.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="text-xs text-gray-600">{doctor.specialty}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {doctor.address.substring(0, 10)}...{doctor.address.substring(doctor.address.length - 6)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {accessLoading[doctor.id] && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  )}
                  <Switch 
                    checked={!!access[doctor.id]} 
                    onCheckedChange={(value) => toggleAccess(doctor.id, doctor.address, value)}
                    disabled={accessLoading[doctor.id]}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Records Display */}
        <Card className="bg-white/60 backdrop-blur-lg text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> My Health Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-sm text-gray-600">No records uploaded yet. Upload your first medical file above.</div>
            ) : (
              <div className="space-y-3">
                {records.map((record, i) => (
                  <div key={i} className="border rounded-md p-3 bg-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{record.filename}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Uploaded: {record.uploadDate} • Type: {record.fileType.split('/')[1].toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          IPFS: {record.cid.substring(0, 20)}...
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`ipfs://${record.cid}`);
                            alert("IPFS link copied to clipboard!");
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => window.open(`https://ipfs.io/ipfs/${record.cid}`, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Chatbot */}
        <Card className="bg-white/60 backdrop-blur-lg text-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> AI Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 border rounded-md p-3 overflow-auto space-y-2 bg-white/20 backdrop-blur-sm">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                  <span
                    className={`inline-block rounded-md px-3 py-2 max-w-[80%] text-sm ${
                      msg.role === "user" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-800 border"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder="Ask about your health records..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      sendMessage(value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>(
                    'input[placeholder="Ask about your health records..."]'
                  );
                  if (input && input.value.trim()) {
                    sendMessage(input.value.trim());
                    input.value = "";
                  }
                }}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}