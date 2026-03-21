'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { validateCCCD, getAgeFromCCCD } from '@/lib/utils/cccd';
import { usePassengerGroups, getPassengerGroupByAge, getChildGroup } from '../hooks/use-passenger-groups';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check } from 'lucide-react';

import { BookingTimer } from './booking-timer';
import { CancelBookingButton } from './cancel-booking-button';

import { PassengerFormData } from '@/lib/schemas/booking.schema';

interface PassengerInfoFormProps {
    seats: Array<{ id: string; name: string; price: number }>;
    onSubmit: (passengers: PassengerFormData[]) => void;
    onCancel: () => void;
    initialPassengers?: PassengerFormData[];
    submitLabel?: React.ReactNode;
    bookingCode?: string;
    bookingExpiresAt?: string;
}

export function PassengerInfoForm({
    seats,
    onSubmit,
    onCancel,
    initialPassengers,
    submitLabel = 'Tiếp tục thanh toán',
    bookingCode,
    bookingExpiresAt
}: PassengerInfoFormProps) {
    const { data: passengerGroups, isLoading: isLoadingGroups } = usePassengerGroups();

    const [passengers, setPassengers] = useState<PassengerFormData[]>([]);
    const [errors, setErrors] = useState<Record<number, string>>({});
    const [cccdInfo, setCccdInfo] = useState<Record<number, { age: number; groupName: string } | null>>({});


    // Initialize/Sync passengers with seats and initialPassengers
    useEffect(() => {
        if (seats.length === 0) return;

        setPassengers(prev => {
            // Only update if length differs or it's the first load (empty), 
            // to avoid overwriting user input on minor re-renders (though seats shouldn't change)
            if (prev.length === seats.length && prev[0]?.seatId === seats[0]?.id) return prev;

            return seats.map((seat, index) => {
                const init = initialPassengers?.[index];
                if (init) {
                    return {
                        seatId: seat.id,
                        seatName: seat.name,
                        passengerName: init.passengerName || '',
                        passengerId: init.passengerId || '',
                        passengerGroupId: init.passengerGroupId || '',
                        ageCategory: init.ageCategory || ((!init.passengerId || init.passengerId === 'N/A') ? 'child' : 'adult'),
                    };
                }
                return {
                    seatId: seat.id,
                    seatName: seat.name,
                    passengerName: '',
                    passengerId: '',
                    passengerGroupId: '',
                    ageCategory: 'adult',
                };
            });
        });
    }, [seats, initialPassengers]);

    // Validate CCCD for pre-filled data or when groups load
    useEffect(() => {
        if (passengers.length > 0 && passengerGroups && !isLoadingGroups) {
            const newCccdInfo = { ...cccdInfo };
            let hasUpdates = false;

            passengers.forEach((p, index) => {
                // If we have a valid adult passenger with ID but no info calculated yet
                if (p.ageCategory === 'adult' && p.passengerId && p.passengerId.length === 12 && !newCccdInfo[index]) {
                    const validation = validateCCCD(p.passengerId);
                    if (validation.isValid && validation.age !== undefined) {
                        const group = getPassengerGroupByAge(validation.age, passengerGroups);
                        if (group) {
                            newCccdInfo[index] = { age: validation.age, groupName: group.name };
                            hasUpdates = true;
                        }
                    }
                }
            });

            if (hasUpdates) {
                setCccdInfo(newCccdInfo);
            }
        }
    }, [passengerGroups, isLoadingGroups, passengers]); // Added passengers to dependency to run after init

    const updatePassenger = (index: number, field: keyof PassengerFormData, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };

        // Handle age category change
        if (field === 'ageCategory') {
            if (value === 'child') {
                // Child: Set N/A and CHILD group
                newPassengers[index].passengerId = 'N/A';
                const childGroup = passengerGroups ? getChildGroup(passengerGroups) : null;
                newPassengers[index].passengerGroupId = childGroup?.id || '';
                setCccdInfo({ ...cccdInfo, [index]: null });
                setErrors({ ...errors, [index]: '' });
            } else {
                // Adult: Clear CCCD
                newPassengers[index].passengerId = '';
                newPassengers[index].passengerGroupId = '';
                setCccdInfo({ ...cccdInfo, [index]: null });
            }
        }

        // Handle CCCD input for adults
        if (field === 'passengerId' && newPassengers[index].ageCategory === 'adult') {
            const cccd = value.trim();

            if (cccd.length === 12) {
                const validation = validateCCCD(cccd);

                if (validation.isValid && validation.age !== undefined) {
                    // Valid CCCD: Auto-detect group
                    const group = passengerGroups ? getPassengerGroupByAge(validation.age, passengerGroups) : null;

                    if (group) {
                        newPassengers[index].passengerGroupId = group.id;
                        setCccdInfo({
                            ...cccdInfo,
                            [index]: { age: validation.age, groupName: group.name },
                        });
                        setErrors({ ...errors, [index]: '' });
                    } else {
                        setErrors({ ...errors, [index]: 'Không tìm thấy nhóm hành khách phù hợp' });
                        setCccdInfo({ ...cccdInfo, [index]: null });
                    }
                } else {
                    setErrors({ ...errors, [index]: validation.error || 'CCCD không hợp lệ' });
                    setCccdInfo({ ...cccdInfo, [index]: null });
                }
            } else if (cccd.length > 0) {
                setErrors({ ...errors, [index]: '' });
                setCccdInfo({ ...cccdInfo, [index]: null });
            }
        }

        setPassengers(newPassengers);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<number, string> = {};
        let isValid = true;

        passengers.forEach((passenger, index) => {
            // Validate name
            if (!passenger.passengerName.trim()) {
                newErrors[index] = 'Vui lòng nhập họ tên';
                isValid = false;
                return;
            }

            // Validate CCCD for adults
            if (passenger.ageCategory === 'adult') {
                if (!passenger.passengerId || passenger.passengerId.length !== 12) {
                    newErrors[index] = 'Vui lòng nhập CCCD hợp lệ (12 số)';
                    isValid = false;
                    return;
                }

                const validation = validateCCCD(passenger.passengerId);
                if (!validation.isValid) {
                    newErrors[index] = validation.error || 'CCCD không hợp lệ';
                    isValid = false;
                    return;
                }

                if (!passenger.passengerGroupId) {
                    newErrors[index] = 'Không xác định được nhóm hành khách';
                    isValid = false;
                    return;
                }
            } else {
                // Validate child
                if (!passenger.passengerGroupId) {
                    newErrors[index] = 'Không xác định được nhóm trẻ em';
                    isValid = false;
                    return;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit(passengers);
        }
    };

    if (isLoadingGroups) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-[#802222] text-white p-5 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Thông tin hành khách</CardTitle>
                        <CardDescription className="text-rose-100/70 font-medium text-[10px] mt-0.5">
                            Vui lòng nhập thông tin cho {seats.length} hành khách
                        </CardDescription>
                    </div>
                    {bookingExpiresAt && (
                        <BookingTimer expiresAt={bookingExpiresAt} />
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-6">
                {passengers.map((passenger, index) => (
                    <div key={passenger.seatId} className="bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-zinc-800 space-y-5 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none group">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#802222] dark:text-rose-400">Ghế {passenger.seatName}</h3>
                            {cccdInfo[index] && (
                                <Badge variant="secondary" className="bg-rose-50 dark:bg-rose-950/20 text-[#802222] dark:text-rose-400 border-none font-medium px-3 py-1 rounded-full text-[11px] gap-1">
                                    <Check className="h-3 w-3" />
                                    {cccdInfo[index]!.groupName} - {cccdInfo[index]!.age} tuổi
                                </Badge>
                            )}
                        </div>

                        {/* Age Category */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-medium text-muted-foreground">Độ tuổi</Label>
                            <RadioGroup
                                value={passenger.ageCategory}
                                onValueChange={(value: string) => updatePassenger(index, 'ageCategory', value)}
                                className="flex flex-wrap gap-4"
                            >
                                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-[#802222]/30 transition-colors">
                                    <RadioGroupItem value="child" id={`child-${index}`} className="border-[#802222] text-[#802222]" />
                                    <Label htmlFor={`child-${index}`} className="font-medium text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                                        Dưới 14 tuổi (Trẻ em)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-[#802222]/30 transition-colors">
                                    <RadioGroupItem value="adult" id={`adult-${index}`} className="border-[#802222] text-[#802222]" />
                                    <Label htmlFor={`adult-${index}`} className="font-medium text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                                        Từ 14 tuổi trở lên
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Passenger Name */}
                        <div className="space-y-3">
                            <Label htmlFor={`name-${index}`} className="text-[11px] font-medium text-muted-foreground">
                                Họ và tên <span className="text-[#802222]">*</span>
                            </Label>
                            <Input
                                id={`name-${index}`}
                                placeholder="Nguyễn Văn A..."
                                value={passenger.passengerName}
                                onChange={(e) => updatePassenger(index, 'passengerName', e.target.value)}
                                className="h-11 rounded-xl border-gray-100 dark:border-zinc-800 font-medium focus-visible:ring-[#802222] transition-all bg-white dark:bg-zinc-900"
                            />
                        </div>

                        {/* CCCD (only for adults) */}
                        {passenger.ageCategory === 'adult' && (
                            <div className="space-y-3">
                                <Label htmlFor={`cccd-${index}`} className="text-[11px] font-medium text-muted-foreground">
                                    Số CCCD/CMND <span className="text-[#802222]">*</span>
                                </Label>
                                <Input
                                    id={`cccd-${index}`}
                                    placeholder="001203012345"
                                    value={passenger.passengerId}
                                    onChange={(e) => updatePassenger(index, 'passengerId', e.target.value)}
                                    maxLength={12}
                                    pattern="[0-9]*"
                                    className="h-11 rounded-xl border-gray-100 dark:border-zinc-800 font-medium focus-visible:ring-[#802222] transition-all bg-white dark:bg-zinc-900"
                                />
                                <p className="text-[10px] font-medium text-muted-foreground opacity-60">
                                    Nhập 12 số CCCD để tự động xác định nhóm hành khách
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {errors[index] && (
                            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-none rounded-xl text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm font-medium">{errors[index]}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                ))}

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                    {bookingCode ? (
                        <div className="flex-1 flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={onCancel} 
                                className="flex-1 h-11 rounded-xl font-semibold border-gray-100 hover:bg-gray-50 transition-all text-xs"
                            >
                                Quay lại
                            </Button>
                            <CancelBookingButton
                                bookingCode={bookingCode}
                                className="flex-1 h-11 rounded-xl font-semibold transition-all text-xs"
                                onCancelSuccess={onCancel}
                                variant="destructive"
                            >
                                Hủy đơn
                            </CancelBookingButton>
                        </div>
                    ) : (
                        <Button 
                            variant="outline" 
                            onClick={onCancel} 
                            className="flex-1 h-11 rounded-xl font-semibold border-gray-100 hover:bg-gray-50 transition-all text-xs"
                        >
                            Quay lại
                        </Button>
                    )}

                    <Button 
                        onClick={handleSubmit} 
                        className="flex-1 h-11 bg-[#802222] hover:bg-rose-900 text-white rounded-xl font-semibold shadow-lg shadow-rose-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] border-none text-xs"
                    >
                        {submitLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
