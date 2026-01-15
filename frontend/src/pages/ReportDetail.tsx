import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Shield } from 'lucide-react';
import CaseCommunication from '@/components/CaseCommunication';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, [id]);

    const loadReport = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const response = await axios.get(`${API_URL}/reports/${id}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="h-8 w-8 border-2 border-ocean-primary border-t-transparent animate-spin rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Report not found</p>
                        <Button onClick={() => navigate('/dashboard')} className="mt-4">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {/* Report Header */}
            <Card className="ocean-card">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Shield className="h-6 w-6 text-ocean-primary" />
                                Report #{report.id.substring(0, 8)}
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {report.location || `${report.latitude}, ${report.longitude}`}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(report.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <Badge variant={
                            report.status === 'Verified by AI' ? 'default' :
                                report.status === 'Resolved' ? 'secondary' :
                                    'outline'
                        }>
                            {report.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Evidence Photo</h3>
                            <img
                                src={report.photo_url}
                                alt="Report evidence"
                                className="w-full rounded-lg border"
                            />
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-sm text-muted-foreground">{report.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">AI Classification</h4>
                                    <p className="text-sm font-mono">{report.ai_class || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Confidence</h4>
                                    <p className="text-sm">{report.ai_confidence ? `${(report.ai_confidence * 100).toFixed(1)}%` : 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Severity</h4>
                                    <p className="text-sm">{report.severity}/10</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">Status</h4>
                                    <p className="text-sm">{report.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Communication Section */}
            <CaseCommunication reportId={id!} />
        </div>
    );
};

export default ReportDetail;
