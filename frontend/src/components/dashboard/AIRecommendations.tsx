import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Brain } from 'lucide-react';

interface RecommendationProps {
    title: string;
    items: string[];
    variant: 'destructive' | 'warning' | 'success';
}

const RecommendationSection = ({ title, items, variant }: RecommendationProps) => {
    const getStyles = () => {
        switch (variant) {
            case 'destructive':
                return 'bg-destructive/10 border-destructive/20 text-destructive';
            case 'warning':
                return 'bg-warning/10 border-warning/20 text-warning';
            case 'success':
                return 'bg-success/10 border-success/20 text-success';
        }
    };

    return (
        <div className={`p-4 rounded-lg border ${getStyles()}`}>
            <h3 className="font-semibold mb-2">{title}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
                {items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

const AIRecommendations = () => {
    return (
        <Card className="ocean-card">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-ocean-primary" />
                    <span>AI-Generated Action Recommendations</span>
                </CardTitle>
                <CardDescription>
                    Data-driven suggestions for immediate and long-term conservation strategy
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RecommendationSection
                        title="Immediate Action Required"
                        variant="destructive"
                        items={[
                            "• Implement stricter industrial discharge controls",
                            "• Establish emergency response protocols",
                            "• Increase monitoring in critical zones"
                        ]}
                    />

                    <RecommendationSection
                        title="Medium-term Strategy"
                        variant="warning"
                        items={[
                            "• Expand plastic waste collection programs",
                            "• Develop sustainable fishing guidelines",
                            "• Create marine protected areas"
                        ]}
                    />

                    <RecommendationSection
                        title="Long-term Vision"
                        variant="success"
                        items={[
                            "• Achieve 50% pollution reduction by 2030",
                            "• Restore degraded marine habitats",
                            "• Build resilient coastal communities"
                        ]}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default AIRecommendations;
