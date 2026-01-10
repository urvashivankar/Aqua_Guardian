import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, CheckCircle, Clock, PieChart, BarChart } from 'lucide-react';
import ReportsTimelineChart from '@/components/charts/ReportsTimelineChart';
import PollutionTypeChart from '@/components/charts/PollutionTypeChart';
import StatusPieChart from '@/components/charts/StatusPieChart';
import SeverityChart from '@/components/charts/SeverityChart';
import ModernKPICard from '@/components/charts/ModernKPICard';
import {
    fetchDashboardStats,
    fetchReportsTimeline,
    fetchReportsByType,
    fetchReportsByStatus,
    fetchSeverityDistribution
} from '@/services/api';
import { useNavigate } from 'react-router-dom';

const CitizenDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_reports: 0,
        active_users: 0,
        resolved_reports: 0,
        verified_reports: 0,
        avg_response_time: 'N/A'
    });
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [pollutionTypes, setPollutionTypes] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [severityData, setSeverityData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, timelineRes, typesRes, statusRes, severityRes] = await Promise.all([
                    fetchDashboardStats(),
                    fetchReportsTimeline(30),
                    fetchReportsByType(),
                    fetchReportsByStatus(),
                    fetchSeverityDistribution()
                ]);

                if (statsRes) setStats(statsRes);
                if (timelineRes) setTimelineData(timelineRes);
                if (typesRes) setPollutionTypes(typesRes);
                if (statusRes) setStatusData(statusRes);
                if (severityRes) setSeverityData(severityRes);
            } catch (error) {
                console.error("Failed to load Citizen dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="space-y-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <h1 className="text-3xl font-bold text-foreground">Community Pollution Tracker</h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-ocean-primary text-white">
                            Citizen Guardian
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Real-time Monitoring & Reporting • Contribution Overview
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernKPICard
                    title="Total Reports"
                    value={stats.total_reports}
                    change={12.5}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color="#0ea5e9"
                    subtitle="Community submissions"
                />
                <ModernKPICard
                    title="Resolved Issues"
                    value={stats.resolved_reports}
                    change={15.7}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="#8b5cf6"
                    subtitle="Successful cleanups"
                />
                <ModernKPICard
                    title="Active Guardians"
                    value={stats.active_users}
                    change={8.3}
                    icon={<Users className="h-5 w-5" />}
                    color="#10b981"
                    subtitle="Neighbors contributing"
                />
                <ModernKPICard
                    title="Avg Response"
                    value={stats.avg_response_time}
                    change={-5.2}
                    icon={<Clock className="h-5 w-5" />}
                    color="#f59e0b"
                    subtitle="Time to verify"
                />
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reports Timeline - Full Width on Mobile, Half on Desktop */}
                <Card className="ocean-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-ocean-primary" />
                            <span>Report Activity</span>
                        </CardTitle>
                        <CardDescription>Daily community submissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] animate-pulse bg-muted/20 rounded-lg" />
                        ) : (
                            <ReportsTimelineChart data={timelineData} />
                        )}
                    </CardContent>
                </Card>

                {/* Pollution Sources - Pie Chart */}
                <Card className="ocean-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="h-5 w-5 text-ocean-primary" />
                            <span>Pollution Sources</span>
                        </CardTitle>
                        <CardDescription>Breakdown by pollution category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] animate-pulse bg-muted/20 rounded-lg" />
                        ) : (
                            <PollutionTypeChart data={pollutionTypes} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Distribution - Donut Chart */}
                <Card className="ocean-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-success" />
                            <span>Resolution Status</span>
                        </CardTitle>
                        <CardDescription>Current status of reported incidents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] animate-pulse bg-muted/20 rounded-lg" />
                        ) : (
                            <StatusPieChart data={statusData} />
                        )}
                    </CardContent>
                </Card>

                {/* Severity Distribution - Bar Chart */}
                <Card className="ocean-card">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart className="h-5 w-5 text-warning" />
                            <span>Severity Distribution</span>
                        </CardTitle>
                        <CardDescription>Reports categorized by impact level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[300px] animate-pulse bg-muted/20 rounded-lg" />
                        ) : (
                            <SeverityChart data={severityData} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CitizenDashboard;
