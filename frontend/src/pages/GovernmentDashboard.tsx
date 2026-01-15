import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, TrendingUp, Shield, FileText, CheckCircle, Upload, Download, Filter, Map, List, Search, Play, Camera, Clock, MessageSquare } from 'lucide-react';
import ModernKPICard from '@/components/charts/ModernKPICard';
import MapComponent, { MapPoint } from '@/components/MapComponent';
import { fetchGovernmentStats, fetchGovernmentJurisdictionReports } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CleanupUploadDialog from '@/components/dashboard/CleanupUploadDialog';
import AIRecommendations from '@/components/dashboard/AIRecommendations';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import { useAuth } from '@/contexts/AuthContext';

const CITY_CENTERS: Record<string, [number, number]> = {
    "Vadodara": [22.3072, 73.1812],
    "vdr.manager": [22.3072, 73.1812],
    "Ahmedabad": [23.0225, 72.5714],
    "ahmedabad.city": [23.0225, 72.5714],
    "Surat": [21.1702, 72.8311],
    "surat.aqua": [21.1702, 72.8311],
    "Rajkot": [22.3039, 70.8022],
    "rajkot.monitoring": [22.3039, 70.8022],
    "Bharuch": [21.7051, 72.9959],
    "bharuch.supervisor": [21.7051, 72.9959],
};

const GovernmentDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState({
        critical_alerts: 0,
        pending_action_items: 0,
        enforcement_actions_taken: 0,
        compliance_rate: "N/A"
    });
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

    // Filters
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const getResponseAge = (dateString: string) => {
        const created = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1 ? "1 day ago" : `${diffDays} days ago`;
    };

    // Modals
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                fetchGovernmentStats(),
                fetchGovernmentJurisdictionReports(),
            ]);

            if (statsRes) setStats(statsRes);
            if (reportsRes) setReports(reportsRes);
        } catch (error) {
            console.error("Failed to load Government dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredReports = reports.filter(r => {
        const matchesStatus = filterStatus === "All" || r.status === filterStatus;
        const matchesType = filterType === "All" || ((r.ai_class || r.type) === filterType);
        const matchesSearch = r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesType && matchesSearch;
    });

    // Map Points
    const mapPoints: MapPoint[] = filteredReports.map(r => ({
        id: r.id,
        lat: r.latitude || 19.0760, // Default to Mumbai if missing
        lng: r.longitude || 72.8777,
        title: r.ai_class ? r.ai_class.replace(/_/g, ' ') : "Pollution Report",
        severity: r.severity * 10, // Scale 1-10 to 10-100
        description: `Status: ${r.status}`,
        isHeatmapOnly: false
    }));

    // Actions
    const handleStartCleaning = async (reportId: string) => {
        try {
            const formData = new FormData();
            formData.append('status', 'Resolution in Progress');
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            await axios.put(`${API_URL}/reports/${reportId}/status`, formData);

            toast({ title: "Status Updated", description: "Cleaning crew dispatched. Report marked as 'In Progress'." });
            loadData();
            setSelectedReport(null); // Close modal
        } catch (error) {
            console.error("Update failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
        }
    };

    const cityName = user?.name?.replace(" Admin", "") || "City";
    const cityCenter = cityName && CITY_CENTERS[cityName] ? CITY_CENTERS[cityName] : [19.0760, 72.8777];

    // Map Center from first report if available, else city center
    const mapCenter: [number, number] = reports.length > 0 && reports[0].latitude
        ? [reports[0].latitude, reports[0].longitude]
        : (cityCenter as [number, number]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">

            {/* Header / Command Center Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="h-8 w-8 text-blue-700" />
                        {user?.name?.replace(" Admin", "") || "City"} Command Center
                    </h1>
                    <p className="text-muted-foreground">Municipal Pollution Oversight & Response System</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={viewMode === 'map' ? 'default' : 'outline'} onClick={() => setViewMode('map')} size="sm">
                        <Map className="h-4 w-4 mr-2" /> Map View
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} size="sm">
                        <List className="h-4 w-4 mr-2" /> List View
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModernKPICard
                    title="Total Reports"
                    value={stats.pending_action_items + stats.enforcement_actions_taken} // Approx total using avail stats
                    change={0}
                    icon={<FileText className="h-5 w-5" />}
                    color="#64748b"
                    subtitle="All time"
                />
                <ModernKPICard
                    title="Pending"
                    value={reports.filter(r => r.status === 'Verified' || r.status === 'Verified by AI').length}
                    change={12}
                    icon={<AlertOctagon className="h-5 w-5" />}
                    color="#ef4444"
                    subtitle="Action required"
                />
                <ModernKPICard
                    title="In Progress"
                    value={reports.filter(r => r.status === 'Resolution in Progress').length}
                    change={-5}
                    icon={<TrendingUp className="h-5 w-5" />}
                    color="#f59e0b"
                    subtitle="Crew dispatch"
                />
                <ModernKPICard
                    title="Resolved"
                    value={reports.filter(r => ['Resolved', 'Closed'].includes(r.status)).length}
                    change={8}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="#10b981"
                    subtitle="Successfully cleaned"
                />
            </div>

            {/* AI Recommendations Section */}
            <AIRecommendations />

            {/* Filter Panel */}
            <Card className="bg-card/50 border-input">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search location or ID..."
                            className="pl-8 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full md:w-[200px] bg-background">
                            <SelectValue placeholder="Pollution Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="Plastic_Pollution">Plastic Pollution</SelectItem>
                            <SelectItem value="Oil_Spill">Oil Spill</SelectItem>
                            <SelectItem value="Industrial_Discharge">Industrial Discharge</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-[200px] bg-background">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="Verified">Pending</SelectItem>
                            <SelectItem value="Resolution in Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Main Content Area: Map or List */}
            <div className="h-[600px] w-full bg-card rounded-xl border border-input overflow-hidden relative">
                {viewMode === 'map' ? (
                    <MapComponent points={mapPoints} zoom={12} center={mapCenter} showHeatmap={false} />
                ) : (
                    <div className="overflow-auto h-full p-4">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Report ID</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Age</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedReport(report)}>
                                        <td className="px-4 py-3 font-mono">{report.id.substring(0, 8)}...</td>
                                        <td className="px-4 py-3 truncate max-w-[200px]">{report.location || "Unknown"}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">{report.ai_class?.replace(/_/g, ' ') || report.type}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {getResponseAge(report.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={
                                                report.status === 'Verified' ? 'bg-red-500' :
                                                    report.status === 'Resolution in Progress' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                            }>
                                                {report.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                <AlertOctagon className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Report Detail Modal (Critical Command Center Detail) */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedReport && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex justify-between items-center text-2xl">
                                    <span>Incident #{selectedReport.id.substring(0, 8)}</span>
                                    <Badge variant="outline" className="text-base px-3">{selectedReport.status}</Badge>
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    <Map className="h-4 w-4" /> {selectedReport.location || "Location Coordinates"}
                                    <span className="mx-2">•</span>
                                    {new Date(selectedReport.created_at).toLocaleString()}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                {/* Left: Evidence */}
                                <div className="space-y-4">
                                    <div className="rounded-lg overflow-hidden border border-border bg-muted/20 relative aspect-video">
                                        <img
                                            src={selectedReport.photo_url}
                                            alt="Evidence"
                                            className="object-cover w-full h-full"
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                            AI Confidence: {(selectedReport.ai_confidence * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                                        <h4 className="font-semibold text-foreground">AI Analysis Result</h4>
                                        <p>Detected: <span className="font-mono text-blue-600">{selectedReport.ai_class}</span></p>
                                        <p>Severity Score: {selectedReport.severity}/10</p>
                                    </div>
                                </div>

                                {/* Right: Actions & Map */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Description</h4>
                                        <p className="text-sm text-muted-foreground bg-card border p-3 rounded-md">
                                            {selectedReport.description}
                                        </p>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-blue-700" />
                                            Command Actions
                                        </h4>

                                        <div className="grid grid-cols-1 gap-3">
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => window.location.href = `/report/${selectedReport.id}`}
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4" /> View Official Discussion
                                            </Button>

                                            {selectedReport.status === 'Verified' && (
                                                <Button
                                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                                                    onClick={() => handleStartCleaning(selectedReport.id)}
                                                >
                                                    <Play className="mr-2 h-4 w-4" /> Mark as Cleaning Started
                                                </Button>
                                            )}

                                            {['Verified', 'Resolution in Progress'].includes(selectedReport.status) && (
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => setIsCleanupDialogOpen(true)}
                                                >
                                                    <Camera className="mr-2 h-4 w-4" /> Upload Cleanup Proof & Close
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Action logged by: Official Authority
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cleanup Upload Dialog */}
            {selectedReport && (
                <CleanupUploadDialog
                    isOpen={isCleanupDialogOpen}
                    onClose={() => setIsCleanupDialogOpen(false)}
                    reportId={selectedReport.id}
                    onSuccess={() => {
                        loadData(); // Refresh list
                        setSelectedReport(null); // Close main detail modal too
                    }}
                />
            )}
        </div>
    );
};

export default GovernmentDashboard;
