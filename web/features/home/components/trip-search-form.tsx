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

export interface TripSearchFormProps {
    className?: string;
    defaultValues?: Partial<TripSearchInput>;
    onSubmit?: (values: TripSearchInput) => void;
}

export function TripSearchForm({ className, defaultValues, onSubmit: externalOnSubmit }: TripSearchFormProps) {
    const router = useRouter();
    const { data: stationsData } = useStations({ page: 1, limit: 100 });
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

    const onSubmit = (values: TripSearchInput) => {
        if (externalOnSubmit) {
            externalOnSubmit(values);
            return;
        }

        const params = new URLSearchParams();
        params.append('from', values.fromStationId);
        params.append('to', values.toStationId);
        params.append('date', values.date);

        router.push(`/onboard/booking?${params.toString()}`);
    };

    return (
        <div className={cn("w-full rounded-xl bg-white/95 p-6 shadow-xl backdrop-blur-sm dark:bg-zinc-900/95 border border-white/20", className)}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <FormField
                        control={form.control}
                        name="fromStationId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <FormLabel className="flex items-center gap-2">
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
                                                    "w-full justify-between h-12 bg-background",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? stations.find(
                                                        (station) => station.id === field.value
                                                    )?.name
                                                    : "Chọn ga đi"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Tìm kiếm ga..." />
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
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
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
                                <FormLabel className="flex items-center gap-2">
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
                                                    "w-full justify-between h-12 bg-background",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? stations.find(
                                                        (station) => station.id === field.value
                                                    )?.name
                                                    : "Chọn ga đến"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Tìm kiếm ga..." />
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
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
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
                                <FormLabel className="flex items-center gap-2">
                                    Ngày đi
                                </FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full pl-3 text-left font-normal h-12 bg-background',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                            disabled={(date) => date < new Date(timeSync.now().setHours(0, 0, 0, 0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <div className="">
                        <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all">
                            <Search className="mr-2 h-5 w-5" />
                            Tìm kiếm
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
