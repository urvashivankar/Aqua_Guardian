import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, User, Shield, Info, AlertCircle, CheckCircle, FileUp, Clock, AlertTriangle } from 'lucide-react';
import { fetchReportDiscussions, addReportDiscussion } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import FileUploader from '@/components/FileUploader';

interface Message {
    id: string;
    report_id: string;
    user_id: string;
    message_type: string;
    content: string;
    photo_url?: string;
    created_at: string;
    user_role: string;
    user_name: string;
}

interface CaseCommunicationProps {
    reportId: string;
}

const CaseCommunication = ({ reportId }: CaseCommunicationProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const [newMessageType, setNewMessageType] = useState<string>('');
    const [newMessageContent, setNewMessageContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const userRole = (user?.role || 'Citizen').toLowerCase();

    const VALID_TYPES: Record<string, { label: string; icon: any; color: string }[]> = {
        citizen: [
            { label: 'CLARIFICATION', icon: Info, color: 'text-blue-500' },
            { label: 'PROOF_UPLOAD', icon: FileUp, color: 'text-green-500' }
        ],
        ngo: [
            { label: 'FIELD_UPDATE', icon: AlertTriangle, color: 'text-orange-500' },
            { label: 'PROOF_UPLOAD', icon: FileUp, color: 'text-green-500' }
        ],
        government: [
            { label: 'INFO_REQUEST', icon: HelpCircle, color: 'text-purple-500' },
            { label: 'STATUS_UPDATE', icon: Clock, color: 'text-blue-500' },
            { label: 'PROOF_UPLOAD', icon: FileUp, color: 'text-green-500' },
            { label: 'CLOSURE_NOTE', icon: CheckCircle, color: 'text-success' }
        ]
    };

    // Helper icons/colors for rendering
    const MESSAGE_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
        'INFO_REQUEST': { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        'STATUS_UPDATE': { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        'CLARIFICATION': { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        'FIELD_UPDATE': { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        'PROOF_UPLOAD': { icon: FileUp, color: 'text-green-600', bgColor: 'bg-green-100' },
        'CLOSURE_NOTE': { icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-100' }
    };

    useEffect(() => {
        loadDiscussions();
    }, [reportId]);

    const loadDiscussions = async () => {
        setIsLoading(true);



        try {
            const data = await fetchReportDiscussions(reportId);
            setMessages(data);
        } catch (error) {
            console.error('Error loading discussions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!newMessageType) {
            toast({ title: "Validation Error", description: "Please select a message type", variant: "destructive" });
            return;
        }
        if (!newMessageContent.trim()) {
            toast({ title: "Validation Error", description: "Message content cannot be empty", variant: "destructive" });
            return;
        }

        setIsSending(true);

        // --- DEMO MODE SIMULATION ---
        if (user.id.startsWith('simulated-')) {
            setTimeout(() => {
                const newMsg: Message = {
                    id: `demo-msg-${Date.now()}`,
                    report_id: reportId,
                    user_id: user.id,
                    message_type: newMessageType,
                    content: newMessageContent,
                    created_at: new Date().toISOString(),
                    user_role: userRole,
                    user_name: user?.name || user?.email || 'Demo User'
                };
                setMessages(prev => [...prev, newMsg]);

                toast({ title: "Message Posted", description: "Your message has been added to the official record. (Demo Mode)" });
                setNewMessageContent('');
                setNewMessageType('');
                setSelectedFile(null);
                setIsSending(false);
            }, 800);
            return;
        }
        // ----------------------------

        try {
            const formData = new FormData();
            formData.append('message_type', newMessageType);
            formData.append('content', newMessageContent);
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            await addReportDiscussion(reportId, formData);

            toast({ title: "Message Posted", description: "Your message has been added to the official record." });

            // Reset form
            setNewMessageContent('');
            setNewMessageType('');
            setSelectedFile(null);

            // Reload messages
            loadDiscussions();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="ocean-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-ocean-primary" />
                            <span>Report Discussion / Case Communication</span>
                        </CardTitle>
                        <CardDescription>Official audit trail for Report ID: {reportId.substring(0, 8)}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono py-1">IMMUTABLE LOG</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="flex flex-col h-[600px]">
                    {/* Timeline View */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-2">
                                <div className="h-8 w-8 border-2 border-ocean-primary border-t-transparent animate-spin rounded-full"></div>
                                <p className="text-xs text-muted-foreground">Retrieving audit trail...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                                <div>
                                    <p className="font-medium">No communication history</p>
                                    <p className="text-sm">Start the discussion by posting an official update.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, idx) => {
                                    const config = MESSAGE_TYPE_CONFIG[msg.message_type] || { icon: MessageSquare, color: 'text-slate-600', bgColor: 'bg-slate-100' };
                                    const Icon = config.icon;

                                    return (
                                        <div key={msg.id} className="relative pl-8 pb-4">
                                            {/* Timeline line */}
                                            {idx !== messages.length - 1 && (
                                                <div className="absolute left-[15px] top-[30px] bottom-0 w-[2px] bg-slate-200"></div>
                                            )}

                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${config.bgColor}`}>
                                                <Icon className={`h-4 w-4 ${config.color}`} />
                                            </div>

                                            <div className="bg-white border rounded-lg p-3 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-sm text-foreground">{msg.user_name}</span>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-4">
                                                            {msg.user_role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-muted-foreground">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {new Date(msg.created_at).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <Badge variant="secondary" className={`${config.color} ${config.bgColor} border-none text-[9px] font-bold`}>
                                                        {msg.message_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>

                                                {msg.photo_url && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={msg.photo_url}
                                                            alt="Attachment"
                                                            className="max-w-xs rounded border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(msg.photo_url, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="border-t p-4 bg-white">
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-4">
                            <p className="text-[10px] text-amber-800 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Responses may take time. This is an official communication channel. No editing or deletion allowed.
                            </p>
                        </div>

                        <form onSubmit={handlePostMessage} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="msg-type" className="text-xs font-bold uppercase text-slate-500">Message Type *</Label>
                                    <Select value={newMessageType} onValueChange={setNewMessageType}>
                                        <SelectTrigger id="msg-type" className="bg-slate-50 border-slate-200 h-9">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VALID_TYPES[userRole]?.map(type => (
                                                <SelectItem key={type.label} value={type.label}>
                                                    <div className="flex items-center">
                                                        <type.icon className={`h-4 w-4 mr-2 ${type.color}`} />
                                                        <span>{type.label.replace('_', ' ')}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Attachment (Optional)</Label>
                                    <FileUploader
                                        onFileSelect={setSelectedFile}
                                        className="h-9 py-0 flex items-center"
                                        compact
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="msg-content" className="text-xs font-bold uppercase text-slate-500">Content *</Label>
                                <Textarea
                                    id="msg-content"
                                    placeholder={`Write your ${newMessageType?.toLowerCase().replace('_', ' ') || 'message'}...`}
                                    value={newMessageContent}
                                    onChange={(e) => setNewMessageContent(e.target.value)}
                                    className="min-h-[80px] bg-slate-50 border-slate-200 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="text-[10px] text-muted-foreground italic">
                                    Logged as {user?.email} ({userRole})
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isSending || !newMessageType || !newMessageContent.trim()}
                                    className="wave-animation h-9 px-6"
                                >
                                    {isSending ? (
                                        "Posting..."
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Post to Discussion
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Placeholder for missing icon
const HelpCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

export default CaseCommunication;
