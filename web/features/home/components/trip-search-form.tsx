import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Search, Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { tripSearchSchema, type TripSearchInput } from '@/lib/schemas/booking.schema';
import { useStations } from '@/features/stations/hooks/use-stations';
import { timeSync } from '@/lib/time-sync';
import { useAuth } from '@/hooks/use-auth';

export interface TripSearchFormProps {
    className?: string;
    defaultValues?: Partial<TripSearchInput>;
    onSubmit?: (values: TripSearchInput) => void;
}

export function TripSearchForm({ className, defaultValues, onSubmit: externalOnSubmit }: TripSearchFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { data: stationsData } = useStations({ page: 1, limit: 1000 });
    const stations = stationsData?.data || [];
    const [openFrom, setOpenFrom] = useState(false);
    const [openTo, setOpenTo] = useState(false);

    const form = useForm<TripSearchInput>({
        resolver: zodResolver(tripSearchSchema),
        defaultValues: {
            fromStationId: defaultValues?.fromStationId || '',
            toStationId: defaultValues?.toStationId || '',
            date: defaultValues?.date || format(timeSync.now(), 'yyyy-MM-dd'),
        },
    });

    const { isSubmitting } = form.formState;

    const onSubmit = (values: TripSearchInput) => {
        if (externalOnSubmit) {
            externalOnSubmit(values);
            return;
        }

        const params = new URLSearchParams();
        params.append('from', values.fromStationId);
        params.append('to', values.toStationId);
        params.append('date', values.date);

        const prefix = user ? '/dashboard' : '';
        router.push(`${prefix}/booking?${params.toString()}`);
    };

    return (
        <div className={cn("w-full rounded-[1.5rem] bg-white/95 p-6 shadow-xl backdrop-blur-md dark:bg-zinc-900/95 border border-white/20", className)}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <FormField
                        control={form.control}
                        name="fromStationId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <FormLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                    Ga đi
                                </FormLabel>
                                <Popover open={openFrom} onOpenChange={setOpenFrom}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openFrom}
                                                className={cn(
                                                    "w-full justify-between h-12 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl text-sm font-medium px-4 hover:bg-gray-100 transition-all",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value
                                                        ? stations.find(
                                                            (station) => station.id === field.value
                                                        )?.name
                                                        : "Chọn ga đi"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
                                        <Command>
                                            <CommandInput placeholder="Tìm kiếm ga..." className="h-12" />
                                            <CommandList>
                                                <CommandEmpty>Không tìm thấy ga.</CommandEmpty>
                                                <CommandGroup>
                                                    {stations.map((station) => (
                                                        <CommandItem
                                                            value={station.name}
                                                            key={station.id}
                                                            onSelect={() => {
                                                                form.setValue("fromStationId", station.id)
                                                                setOpenFrom(false)
                                                            }}
                                                            className="py-2.5 px-4 font-medium"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4 text-[#802222]",
                                                                    station.id === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {station.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="toStationId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <FormLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                    Ga đến
                                </FormLabel>
                                <Popover open={openTo} onOpenChange={setOpenTo}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openTo}
                                                className={cn(
                                                    "w-full justify-between h-12 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl text-sm font-medium px-4 hover:bg-gray-100 transition-all",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value
                                                        ? stations.find(
                                                            (station) => station.id === field.value
                                                        )?.name
                                                        : "Chọn ga đến"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
                                        <Command>
                                            <CommandInput placeholder="Tìm kiếm ga..." className="h-12" />
                                            <CommandList>
                                                <CommandEmpty>Không tìm thấy ga.</CommandEmpty>
                                                <CommandGroup>
                                                    {stations.map((station) => (
                                                        <CommandItem
                                                            value={station.name}
                                                            key={station.id}
                                                            onSelect={() => {
                                                                form.setValue("toStationId", station.id)
                                                                setOpenTo(false)
                                                            }}
                                                            className="py-2.5 px-4 font-medium"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4 text-[#802222]",
                                                                    station.id === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {station.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground ml-1">
                                    Ngày đi
                                </FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full px-4 text-left font-medium h-12 bg-gray-50 dark:bg-zinc-800/50 border-none rounded-2xl text-sm hover:bg-gray-100 transition-all',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden border-none shadow-2xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                            disabled={(date) => date < new Date(timeSync.now().setHours(0, 0, 0, 0))}
                                            initialFocus
                                            className="p-3"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <div>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full h-12 text-sm font-semibold shadow-md shadow-rose-950/10 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl bg-[#802222] hover:bg-[#802222]/90 border-none"
                        >
                            <Search className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Đang tìm...' : 'Tìm chuyến'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
