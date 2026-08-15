'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/lib/store/auth.store';
import { Loading } from '@/components/loading';

function BookingTripRedirect() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, isInitialized } = useAuthStore(useShallow((state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
    })));

    useEffect(() => {
        if (!isInitialized) return;

        const tripId = params.tripId as string;
        const query = searchParams.toString();
        const target = `/dashboard/booking/${tripId}${query ? `?${query}` : ''}`;

        if (!user) {
            const callbackUrl = encodeURIComponent(target);
            router.replace(`/login?callbackUrl=${callbackUrl}`);
        } else {
            router.replace(target);
        }
    }, [isInitialized, user, router, searchParams, params.tripId]);

    return <Loading />;
}

export default function BookingTripPage() {
    return (
        <Suspense fallback={<Loading />}>
            <BookingTripRedirect />
        </Suspense>
    );
}