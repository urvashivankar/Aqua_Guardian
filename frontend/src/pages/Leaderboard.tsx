import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Award, Star, Medal } from 'lucide-react';
import api, { fetchLeaderboard } from '@/services/api';
import { toast } from 'sonner';

interface LeaderboardUser {
    user_id: string;
    name: string;
    total_nfts: number;
    reports_verified: number;
    cleanups_completed: number;
    role: string;
    points: number;
}

const Leaderboard = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<LeaderboardUser[]>([]);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                const data = await fetchLeaderboard();
                setUsers(data);
            } catch (error) {
                toast.error("Failed to load leaderboard");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 1: return <Medal className="h-6 w-6 text-slate-300" />;
            case 2: return <Award className="h-6 w-6 text-amber-600" />;
            default: return <span className="font-bold text-muted-foreground">{index + 1}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-5xl py-12">
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight">Community Heroes</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Celebrating the guardians of our waters. Rankings are based on verified reports and completed cleanups.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Top 3 Spotlight */}
                        {users.slice(0, 3).map((user, index) => (
                            <Card key={user.user_id} className={`relative overflow-hidden border-2 ${index === 0 ? 'border-yellow-500 bg-yellow-50/10' : ''}`}>
                                <CardContent className="pt-8 text-center space-y-4">
                                    <div className="absolute top-2 right-2">
                                        {getRankIcon(index)}
                                    </div>
                                    <Avatar className="h-20 w-20 mx-auto border-4 border-background shadow-xl">
                                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                            {user.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-xl">{user.name || 'Anonymous'}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{user.role}</p>
                                    </div>
                                    <div className="flex justify-center gap-4 text-sm font-medium">
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl text-primary">{user.total_nfts}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">NFTs</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Contributors</CardTitle>
                            <CardDescription>A list of our most active community members helping preserve marine life.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Rank</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-center">Reports Verified</TableHead>
                                        <TableHead className="text-center">Cleanups</TableHead>
                                        <TableHead className="text-right font-bold">Total NFTs</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10">Loading heroes...</TableCell></TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Be the first hero to appear here!</TableCell></TableRow>
                                    ) : (
                                        users.map((user, index) => (
                                            <TableRow key={user.user_id} className={index < 3 ? 'bg-muted/30 font-medium' : ''}>
                                                <TableCell className="text-center">
                                                    {getRankIcon(index)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                                                                {user.name?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{user.name || 'Anonymous User'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{user.reports_verified}</TableCell>
                                                <TableCell className="text-center">{user.cleanups_completed}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2 text-primary">
                                                        <Star className="h-4 w-4 fill-primary" />
                                                        <span className="font-bold">{user.total_nfts}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Leaderboard;
