import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { subscribeToPush } from '@/services/api';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = "BCn_rX1kt8isOG0JgDFWc7Lr6Q8gbAH6hN2O7adwFWWFv1ASL3ySrIAAK1AkK6RLvNrSHj52Z0PbC3ucD6klk2A"; // User needs to provide this

export const NotificationManager: React.FC = () => {
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;

        const registerPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.warn('Push notifications not supported by this browser');
                return;
            }

            try {
                // 1. Register Service Worker
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('SW registered:', registration);

                // 2. Request Permission
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('Permission not granted');
                    return;
                }

                // 3. Get Subscription
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Subscribe if not already subscribed
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                // ... inside registerPush ...
                // 4. Send to Backend
                await subscribeToPush({
                    subscription_json: subscription.toJSON(),
                    device_type: /android|iphone|ipad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                });

                console.log('Push subscription synced with backend');

            } catch (err) {
                console.error('Push registration failed:', err);
            }
        };

        registerPush();
    }, [isAuthenticated]);

    return null; // Side-effect only component
};

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
