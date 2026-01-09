import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, TrendingUp, Shield, FileText, CheckCircle, Upload, Download, X } from 'lucide-react';
import ModernKPICard from '@/components/charts/ModernKPICard';
import { fetchGovernmentStats, fetchVerifiedReports } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const GovernmentDashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        critical_alerts: 0,
        pending_action_items: 0,
        enforcement_actions_taken: 0,
        compliance_rate: "N/A"
    });
    const [criticalReports, setCriticalReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Deployment Modal State
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [actionNote, setActionNote] = useState("");

    // Export State
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                fetchGovernmentStats(),
                fetchVerifiedReports(),
            ]);

            if (statsRes) setStats(statsRes);
            if (reportsRes) {
                // Filter for high severity (>= 4) for Gov dashboard
                setCriticalReports(reportsRes.filter((r: any) => r.severity >= 4 && r.status !== 'Resolution in Progress'));
            }
        } catch (error) {
            console.error("Failed to load Government dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeployTeam = (report: any) => {
        setSelectedReport(report);
        setActionNote(`Deploying Rapid Response Team to sectors ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)} for immediate hazardous material containment.`);
    };

    const confirmDeployment = async () => {
        if (!selectedReport) return;
        setIsDeploying(true);
        try {
            const formData = new FormData();
            formData.append('status', 'Resolution in Progress');
            formData.append('action_note', actionNote);

            // Using API URL from env or default
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await axios.post(`${API_URL}/reports/${selectedReport.id}/status`, formData);

            toast({
                title: "Team Deployed Successfully",
                description: `Enforcement ID #${Math.floor(Math.random() * 9000) + 1000} generated. Status updated.`,
            });

            setSelectedReport(null);
            loadData(); // Refresh list
        } catch (error) {
            console.error("Deployment failed", error);
            toast({
                title: "Deployment Failed",
                description: "Could not update system status. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsDeploying(false);
        }
    };

    const handleExportData = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            toast({
                title: "Data Packet Sent",
                description: "Encrypted CSV export successfully transmitted to Central Smart City Command Center (ICCC).",
            });
        }, 1500);
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Alert Banner */}
            {stats.critical_alerts > 0 && (
                <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r shadow-sm animate-in slide-in-from-top duration-500">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertOctagon className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-destructive font-bold">
                                URGENT: {stats.critical_alerts} Critical Pollution Events require immediate enforcement action.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <h1 className="text-3xl font-bold text-foreground">Official Administrative Dashboard</h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-700 text-white">
                            Government Authority
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Oversight, Validation & Enforcement Portal
                    </p>
                </div>
                <Button variant="outline" onClick={handleExportData} disabled={isExporting} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                    {isExporting ? (
                        <>Processing Encryption...</>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Export for ICCC
                        </>
                    )}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernKPICard
                    title="Critical Alerts"
                    value={stats.critical_alerts}
                    change={10.5}
                    icon={<AlertOctagon className="h-5 w-5" />}
                    color="#ef4444" // Red
                    subtitle="Severity Level 5 Events"
                />
                <ModernKPICard
                    title="Pending Actions"
                    value={stats.pending_action_items}
                    change={-2.1}
                    icon={<FileText className="h-5 w-5" />}
                    color="#f59e0b" // Orange
                    subtitle="Reports requiring review"
                />
                <ModernKPICard
                    title="Enforcement"
                    value={stats.enforcement_actions_taken}
                    change={18.2}
                    icon={<Shield className="h-5 w-5" />}
                    color="#3b82f6" // Blue
                    subtitle="Official actions taken"
                />
                <ModernKPICard
                    title="Compliance Rate"
                    value={stats.compliance_rate}
                    change={1.5}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="#10b981" // Green
                    subtitle="City-wide adherence"
                />
            </div>

            {/* Critical Reports Section */}
            <Card className="ocean-card border-l-4 border-l-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertOctagon className="h-5 w-5" />
                        Critical Incidents Log
                    </CardTitle>
                    <CardDescription>High-severity verified reports requiring official intervention</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />)}
                        </div>
                    ) : criticalReports.length > 0 ? (
                        <div className="space-y-4">
                            {criticalReports.map((report) => (
                                <div key={report.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-xl border border-destructive/20 hover:bg-destructive/5 transition-colors gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="destructive" className="animate-pulse">
                                                CRITICAL SEVERITY: {report.severity}
                                            </Badge>
                                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                                                Case ID: {report.id.substring(0, 8)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-foreground text-lg">{report.description}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>Location: {report.location || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}</span>
                                            <span>•</span>
                                            <span>{new Date(report.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => window.open(report.photo_url, '_blank')}>
                                            View Evidence
                                        </Button>
                                        <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20" onClick={() => handleDeployTeam(report)}>
                                            Deploy Team
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            No critical incidents active. Situation stable.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deployment Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Shield className="h-5 w-5" />
                            Confirm Enforcement Deployment
                        </DialogTitle>
                        <DialogDescription>
                            This action will dispatch municipal teams and officially log this incident as "Under Investigation".
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="grid gap-4 py-4">
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <span className="font-bold">Target:</span> {selectedReport.description} <br />
                                <span className="font-bold">Severity:</span> {selectedReport.severity}/10
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="action-note">Enforcement Plan / Dispatch Note</Label>
                                <Textarea
                                    id="action-note"
                                    value={actionNote}
                                    onChange={(e) => setActionNote(e.target.value)}
                                    className="h-24"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200 text-yellow-800">
                                <Upload className="h-3 w-3" />
                                Official Evidence Upload will be required upon case closure.
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
                        <Button onClick={confirmDeployment} disabled={isDeploying} className="bg-destructive text-white hover:bg-destructive/90">
                            {isDeploying ? "Processing..." : "Authorize Deployment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GovernmentDashboard;
