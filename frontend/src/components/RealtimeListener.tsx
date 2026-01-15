import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { MapPin, Droplets, Trophy } from "lucide-react";

export const RealtimeListener = () => {
    useEffect(() => {
        console.log("🔔 Realtime Listener initialized");

        // 1. Listen for NEW reports
        const reportsChannel = supabase
            .channel("public-reports")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "reports" },
                (payload) => {
                    console.log("New report received:", payload);
                    toast("New Pollution Reported!", {
                        description: payload.new.description || "A new incident has been reported.",
                        icon: <MapPin className="h-4 w-4 text-red-500" />,
                        action: {
                            label: "View Map",
                            onClick: () => (window.location.href = "/report-analytics"),
                        },
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "reports" },
                (payload) => {
                    if (payload.old.status !== payload.new.status) {
                        toast(`Report Status Updated`, {
                            description: `A report's status changed to: ${payload.new.status}`,
                            icon: <Droplets className="h-4 w-4 text-blue-500" />,
                        });
                    }
                }
            )
            .subscribe();

        // 2. Listen for NEW Cleanup actions
        const cleanupChannel = supabase
            .channel("public-cleanup")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "cleanup_actions" },
                (payload) => {
                    toast("New Cleanup Action Started!", {
                        description: "An organization has started cleaning a polluted site.",
                        icon: <Trophy className="h-4 w-4 text-green-500" />,
                        action: {
                            label: "Join Now",
                            onClick: () => (window.location.href = "/community"),
                        },
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(reportsChannel);
            supabase.removeChannel(cleanupChannel);
        };
    }, []);

    return null; // This component doesn't render anything visible
};

export default RealtimeListener;
