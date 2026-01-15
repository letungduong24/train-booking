import { Spinner } from '@/components/ui/spinner';

export function Loading() {
    return (
        <div className="flex flex-1 w-full items-center justify-center bg-background">
            <Spinner className="size-12" />
        </div>
    );
}
