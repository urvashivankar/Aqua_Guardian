import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Shield, MapPin, Megaphone, CheckSquare, XSquare, Download, Calendar, Map as MapIcon, List as ListIcon, Search, History, ArrowRight, Camera, Clock, MessageSquare } from 'lucide-react';
import ModernKPICard from '@/components/charts/ModernKPICard';
import MapComponent, { MapPoint } from '@/components/MapComponent';
import { fetchNGOStats, fetchAllReports } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CleanupUploadDialog from '@/components/dashboard/CleanupUploadDialog';
import AIRecommendations from '@/components/dashboard/AIRecommendations';

const NGODashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        verified_reports_pending_action: 0,
        active_cleanup_campaigns: 0,
        total_cleanups_completed: 0,
        volunteer_count: 0
    });
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Action States
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [orgName, setOrgName] = useState("Green Earth Alliance");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
    const [reportToProof, setReportToProof] = useState<any | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                fetchNGOStats(),
                fetchAllReports(),
            ]);

            if (statsRes) setStats(statsRes);
            if (reportsRes) setReports(reportsRes);
        } catch (error) {
            console.error("Failed to load NGO dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const pendingVerificationReports = reports.filter(r => r.status === 'Awaiting Verification');
    const actionableReports = reports.filter(r =>
        r.status === 'Verified' ||
        r.status === 'Verified by AI' ||
        r.status === 'Submitted' ||
        r.status === 'Resolution in Progress'
    );

    // Main Map Points (All active issues)
    const mapPoints: MapPoint[] = reports
        .filter(r => r.status !== 'Resolved' && r.status !== 'Closed')
        .map(r => ({
            id: r.id,
            lat: r.latitude || 19.0760,
            lng: r.longitude || 72.8777,
            title: r.ai_class ? r.ai_class.replace(/_/g, ' ') : "Pollution Report",
            severity: r.severity * 10,
            description: `Status: ${r.status}`,
            isHeatmapOnly: false
        }));

    const handleVerification = async (reportId: string, isApproved: boolean) => {
        setIsVerifying(true);
        try {
            const status = isApproved ? 'Resolved' : 'Verified'; // If rejected, goes back to Verified
            const note = isApproved ? 'Cleanup Verified by NGO Observer' : 'Cleanup rejected: Work incomplete';

            const formData = new FormData();
            formData.append('status', status);
            formData.append('action_note', note);

            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await axios.put(`${API_URL}/reports/${reportId}/status`, formData);

            toast({
                title: isApproved ? "Cleanup Verified! ✅" : "Marked as Incomplete ⚠️",
                description: isApproved ? "Points released to participants." : "Sent back to authorities.",
                variant: isApproved ? "default" : "destructive"
            });
            loadData();
        } catch (error) {
            console.error("Verification failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        } finally {
            setIsVerifying(false);
        }
    };

    const confirmCleanupDrive = async () => {
        if (!selectedReport) return;
        setIsOrganizing(true);
        try {
            const formData = new FormData();
            formData.append('organization', orgName);
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await axios.post(`${API_URL}/cleanup/${selectedReport.id}/start`, formData);

            toast({
                title: "Campaign Launched! 🚀",
                description: `Cleanup drive for "${selectedReport.description}" is now LIVE.`,
            });
            setSelectedReport(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to start campaign.", variant: "destructive" });
        } finally {
            setIsOrganizing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Users className="h-8 w-8 text-green-600" />
                        Observer & Action Hub
                    </h1>
                    <p className="text-muted-foreground">Monitor, Verify, and Mobilize for a cleaner city.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Downloading Report...", description: "CSV Export started." })}>
                        <Download className="mr-2 h-4 w-4" /> Download Data
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernKPICard
                    title="Awaiting Verification"
                    value={pendingVerificationReports.length}
                    change={5.2}
                    icon={<CheckSquare className="h-5 w-5" />}
                    color="#f59e0b"
                    subtitle="Requires audit"
                />
                <ModernKPICard
                    title="Active Campaigns"
                    value={stats.active_cleanup_campaigns}
                    change={0}
                    icon={<Megaphone className="h-5 w-5" />}
                    color="#3b82f6"
                    subtitle="Ongoing missions"
                />
                <ModernKPICard
                    title="Verified & Cleaned"
                    value={stats.total_cleanups_completed}
                    change={12.4}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="#10b981"
                    subtitle="Total impact"
                />
                <ModernKPICard
                    title="Volunteers"
                    value={stats.volunteer_count}
                    change={8.5}
                    icon={<Users className="h-5 w-5" />}
                    color="#8b5cf6"
                    subtitle="Active members"
                />
            </div>

            {/* AI Recommendations Section */}
            <AIRecommendations />

            <Tabs defaultValue="verification" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="verification">Verification Hub</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring Map</TabsTrigger>
                    <TabsTrigger value="action">Action Center</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                </TabsList>

                {/* VERIFICATION HUB */}
                <TabsContent value="verification" className="space-y-4">
                    <Card className="ocean-card border-l-4 border-l-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-yellow-500" />
                                Pending Cleanup Verification
                            </CardTitle>
                            <CardDescription>Review "After" photos and officially verify the cleanup to resolve the report.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="h-20 bg-muted animate-pulse rounded" />
                            ) : pendingVerificationReports.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {pendingVerificationReports.map((report) => (
                                        <div key={report.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 h-64">
                                                <div className="relative border-r bg-muted/20">
                                                    <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">Original Report</div>
                                                    <img src={report.photo_url} className="w-full h-full object-cover grayscale-[0.3]" alt="Before" />
                                                </div>
                                                <div className="relative bg-muted/20">
                                                    <div className="absolute top-2 right-2 z-10 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">Cleanup Proof (Required)</div>
                                                    {report.verification_image || (report.photos && report.photos[1]?.url) ? (
                                                        <img src={report.verification_image || report.photos[1].url} className="w-full h-full object-cover" alt="After" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center">
                                                            <Camera className="h-8 w-8 mb-2 opacity-50" />
                                                            <p className="text-xs font-semibold">NO CLEANUP PROOF UPLOADED</p>
                                                            <p className="text-[10px] opacity-70 mt-1">Officer must upload proof to enable verification.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <h3 className="font-semibold">{report.description}</h3>
                                                    <p className="text-sm text-muted-foreground">{report.location}</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="destructive"
                                                        disabled={isVerifying}
                                                        onClick={() => handleVerification(report.id, false)}
                                                    >
                                                        <XSquare className="mr-2 h-4 w-4" /> Work Incomplete
                                                    </Button>
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={isVerifying}
                                                        onClick={() => handleVerification(report.id, true)}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Cleanup Verified
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3 opacity-20" />
                                    No reports pending verification. All good!
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* MONITORING MAP */}
                <TabsContent value="monitoring" className="space-y-4">
                    <Card className="h-[600px] overflow-hidden border-none shadow-none">
                        <MapComponent points={mapPoints} zoom={11} center={[19.0760, 72.8777]} showHeatmap={false} />
                    </Card>
                </TabsContent>

                {/* ACTION CENTER */}
                <TabsContent value="action" className="space-y-4">
                    <Card className="ocean-card">
                        <CardHeader>
                            <CardTitle>Active Pollution Sites</CardTitle>
                            <CardDescription>Verified reports where you can organize cleanup drives.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {actionableReports.map((report) => (
                                    <div key={report.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-muted/10 rounded-lg border hover:bg-muted/20 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={report.severity >= 8 ? "destructive" : "default"}>
                                                    Severity: {report.severity}
                                                </Badge>
                                                <span className="text-sm font-medium text-muted-foreground">{report.type}</span>
                                            </div>
                                            <h4 className="font-semibold">{report.description}</h4>
                                            <p className="text-xs text-muted-foreground">{report.location}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.location.href = `/report/${report.id}`}
                                                className="mt-2 md:mt-0 border-blue-600 text-blue-600 hover:bg-blue-50"
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4" /> Discussion
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => { setReportToProof(report); setIsCleanupDialogOpen(true); }}
                                                className="mt-2 md:mt-0 border-green-600 text-green-600 hover:bg-green-50"
                                            >
                                                <Camera className="mr-2 h-4 w-4" /> Upload Proof
                                            </Button>
                                            <Button onClick={() => setSelectedReport(report)} className="mt-2 md:mt-0">
                                                <Megaphone className="mr-2 h-4 w-4" /> Organize Drive
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {actionableReports.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No actionable reports available.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AUDIT TRAIL / HISTORY */}
                <TabsContent value="audit" className="space-y-4">
                    <Card className="ocean-card border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-blue-500" />
                                Accountability Record (Prompt 7)
                            </CardTitle>
                            <CardDescription>Complete longitudinal log of every action, status change, and verification date/time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {reports.filter(r => r.status === 'Resolved' || r.action_note).slice(0, 10).map((report) => (
                                    <div key={report.id} className="flex items-start gap-4 p-4 bg-muted/10 rounded-lg border">
                                        <div className="mt-1">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-sm">Incident #{report.id.substring(0, 8)}</h4>
                                                <span className="text-[10px] text-muted-foreground uppercase">{new Date(report.updated_at || report.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm">{report.action_note || "Status updated to " + report.status}</p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Badge variant="outline" className="text-[10px]">{report.status}</Badge>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-[10px] font-mono text-muted-foreground">{report.location || "City Limits"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {reports.filter(r => r.status === 'Resolved' || r.action_note).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">No audit entries found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Campaign Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Launch Cleanup Campaign</DialogTitle>
                        <DialogDescription>Mobilize volunteers for this verified incident.</DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="grid gap-4 py-4">
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <span className="font-bold">Target:</span> {selectedReport.description}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="org-name">Lead Organization</Label>
                                <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
                        <Button onClick={confirmCleanupDrive} disabled={isOrganizing}>
                            {isOrganizing ? "Launching..." : "Publish Campaign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cleanup Upload Dialog for NGOs */}
            {reportToProof && (
                <CleanupUploadDialog
                    isOpen={isCleanupDialogOpen}
                    onClose={() => setIsCleanupDialogOpen(false)}
                    reportId={reportToProof.id}
                    onSuccess={() => {
                        loadData();
                        setReportToProof(null);
                    }}
                />
            )}
        </div>
    );
};

export default NGODashboard;
