import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Trash2, Shield, MapPin, ExternalLink, Megaphone } from 'lucide-react';
import ModernKPICard from '@/components/charts/ModernKPICard';
import { fetchNGOStats, fetchVerifiedReports } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const NGODashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        verified_reports_pending_action: 0,
        active_cleanup_campaigns: 0,
        total_cleanups_completed: 0,
        volunteer_count: 0
    });
    const [verifiedReports, setVerifiedReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Organization Modal State
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [orgName, setOrgName] = useState("Green Earth Alliance"); // Default or fetch from profile

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                fetchNGOStats(),
                fetchVerifiedReports(),
            ]);

            if (statsRes) setStats(statsRes);
            if (reportsRes) setVerifiedReports(reportsRes);
        } catch (error) {
            console.error("Failed to load NGO dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartCleanup = (report: any) => {
        setSelectedReport(report);
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
                description: `Cleanup drive for "${selectedReport.description}" is now LIVE on the Community Board. Volunteers can join.`,
            });

            setSelectedReport(null);
            loadData();
        } catch (error: any) {
            console.error("Campaign creation failed", error);
            const msg = error.response?.data?.detail || "Failed to start campaign.";

            if (msg.includes("SAFETY PROTOCOL")) {
                toast({
                    title: "Access Denied 🛑",
                    description: "This is a High-Severity incident. Only Government agencies can deploy resources for safety reasons.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Error",
                    description: msg,
                    variant: "destructive"
                });
            }
        } finally {
            setIsOrganizing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <h1 className="text-3xl font-bold text-foreground">Organization Impact Overview</h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                            NGO Partner
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Conservation Efforts & Volunteer Management
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernKPICard
                    title="Pending Actions"
                    value={stats.verified_reports_pending_action}
                    change={5.2}
                    icon={<Shield className="h-5 w-5" />}
                    color="#f59e0b"
                    subtitle="Verified reports awaiting cleanup"
                />
                <ModernKPICard
                    title="Active Campaigns"
                    value={stats.active_cleanup_campaigns}
                    change={0}
                    icon={<Users className="h-5 w-5" />}
                    color="#3b82f6"
                    subtitle="Ongoing on-ground missions"
                />
                <ModernKPICard
                    title="Cleanups Done"
                    value={stats.total_cleanups_completed}
                    change={12.4}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="#10b981"
                    subtitle="Total successful missions"
                />
                <ModernKPICard
                    title="Volunteers"
                    value={stats.volunteer_count}
                    change={8.5}
                    icon={<Users className="h-5 w-5" />}
                    color="#8b5cf6"
                    subtitle="Registered active members"
                />
            </div>

            {/* Actionable Reports List */}
            <Card className="ocean-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Verified Pollution Reports (Actionable)
                    </CardTitle>
                    <CardDescription>High-confidence reports ready for cleanup assignment</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />)}
                        </div>
                    ) : verifiedReports.length > 0 ? (
                        <div className="space-y-4">
                            {verifiedReports.map((report) => (
                                <div key={report.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={report.severity >= 4 ? "destructive" : "default"}>
                                                Severity: {report.severity}
                                            </Badge>
                                            <Badge variant="outline" className="text-green-600 border-green-600/30">
                                                {report.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-semibold text-foreground">{report.description}</h3>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {report.location || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => window.open(report.photo_url, '_blank')}>View Details</Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={() => handleStartCleanup(report)}>
                                            <Megaphone className="mr-2 h-4 w-4" />
                                            Organize Drive
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No pending verified reports found. Great job!
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Organization Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-ocean-primary">
                            <Users className="h-5 w-5" />
                            Launch Cleanup Campaign
                        </DialogTitle>
                        <DialogDescription>
                            Mobilize volunteers for this verified incident. This will create a public event card.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="grid gap-4 py-4">
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <span className="font-bold">Location:</span> {selectedReport.description}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="org-name">Lead Organization</Label>
                                <Input
                                    id="org-name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                />
                            </div>
                            {selectedReport.severity >= 8 && (
                                <div className="text-xs text-destructive font-bold p-2 border border-destructive/20 bg-destructive/5 rounded">
                                    ⚠️ WARNING: High Severity Level. Ensure you have specialized equipment or Hazmat certification before proceeding.
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
                        <Button onClick={confirmCleanupDrive} disabled={isOrganizing} className="bg-green-600 hover:bg-green-700 text-white">
                            {isOrganizing ? "Launching..." : "Publish Campaign"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NGODashboard;
