import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Database, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DemoSeeder = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string[]>([]);

    // Gujarat & India Locations
    const locations = [
        { name: "Vishwamitri River, Vadodara", lat: 22.3072, lng: 73.1812 },
        { name: "Sursagar Lake, Vadodara", lat: 22.3008, lng: 73.2043 },
        { name: "Sabarmati Riverfront, Ahmedabad", lat: 23.0225, lng: 72.5714 },
        { name: "Tapi River, Surat", lat: 21.1702, lng: 72.8311 },
        { name: "Dumas Beach, Surat", lat: 21.0688, lng: 72.7068 },
        { name: "Mumbai Harbor", lat: 18.9438, lng: 72.8354 },
        { name: "Juhu Beach", lat: 19.0988, lng: 72.8264 },
    ];

    const generateData = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in!", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setStatus([]);
        const addLog = (msg: string) => setStatus(prev => [...prev, msg]);

        try {
            addLog("🌱 Starting Demo Seeding...");

            // 1. Generate Reports
            addLog("📝 Generating Reports...");
            const reports = [];
            for (let i = 0; i < 15; i++) {
                const loc = locations[Math.floor(Math.random() * locations.length)];
                const pType = ["Industrial Discharge", "Plastic Pollution", "Oil Spill", "Sewage Overflow"][Math.floor(Math.random() * 4)];
                const status = ["Submitted", "Verified", "Resolution in Progress", "Verified by AI"][Math.floor(Math.random() * 4)];

                reports.push({
                    latitude: loc.lat + (Math.random() * 0.01 - 0.005),
                    longitude: loc.lng + (Math.random() * 0.01 - 0.005),
                    severity: Math.floor(Math.random() * 7) + 3,
                    description: `Detected ${pType} at ${loc.name}. Looks critical.`,
                    user_id: user.id,
                    status: status,
                    created_at: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString()
                });
            }

            const { error: reportError } = await supabase.from('reports').insert(reports);
            if (reportError) throw reportError;
            addLog(`✅ Inserted ${reports.length} Reports`);

            // 2. Generate Cleanup Events
            addLog("🧹 Generating Cleanup Events...");
            const events = [
                {
                    title: "Mega Vadodara Cleanup",
                    location_name: "Vishwamitri River",
                    latitude: 22.3072,
                    longitude: 73.1812,
                    description: "City-wide cleanup drive organized by Aqua Guardian.",
                    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "upcoming",
                    organizer_id: user.id,
                    max_participants: 100,
                    current_participants: 45
                },
                {
                    title: "Mumbai Beach Rescue",
                    location_name: "Juhu Beach",
                    latitude: 19.0988,
                    longitude: 72.8264,
                    description: "Removing plastic waste after high tide.",
                    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "upcoming",
                    organizer_id: user.id,
                    max_participants: 200,
                    current_participants: 120
                }
            ];

            const { error: eventError } = await supabase.from('cleanup_events').insert(events);
            if (eventError) {
                addLog(`⚠️ Cleanup Insert Skipped (maybe table missing): ${eventError.message}`);
            } else {
                addLog(`✅ Inserted ${events.length} Cleanup Events`);
            }

            addLog("🎉 SEEDING COMPLETE! You can go back to Dashboard.");
            toast({ title: "Success", description: "Demo data generated!" });

        } catch (error: any) {
            console.error(error);
            addLog(`❌ Error: ${error.message}`);
            toast({ title: "Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <Card className="ocean-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6 text-ocean-primary" />
                        Demo Data Generator
                    </CardTitle>
                    <CardDescription>
                        Generate simulated reports and events for Vadodara, Ahmedabad, Surat, and Mumbai.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[150px] font-mono text-sm">
                        {status.length === 0 ? (
                            <div className="text-muted-foreground italic text-center pt-8">
                                Ready to generate data...
                            </div>
                        ) : (
                            status.map((log, i) => (
                                <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-600' : 'text-slate-700'}`}>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>

                    <Button
                        onClick={generateData}
                        disabled={isLoading || !user}
                        className="w-full h-12 text-lg wave-animation"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Seeding Data...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Generate Demo Data
                            </>
                        )}
                    </Button>

                    {!user && (
                        <div className="flex items-center gap-2 text-red-500 text-sm justify-center">
                            <AlertTriangle className="h-4 w-4" />
                            Please login first to use this tool.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DemoSeeder;
