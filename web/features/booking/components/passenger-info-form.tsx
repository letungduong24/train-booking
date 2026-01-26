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
import { AlertCircle, Check } from 'lucide-react';

import { BookingTimer } from './booking-timer';
import { CancelBookingButton } from './cancel-booking-button';

import { PassengerFormData } from '@/lib/schemas/booking.schema';

interface PassengerInfoFormProps {
    seats: Array<{ id: string; name: string; price: number }>;
    onSubmit: (passengers: PassengerFormData[]) => void;
    onCancel: () => void;
    initialPassengers?: PassengerFormData[];
    submitLabel?: string;
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

    // ... (rest of state/effects)

    // Skip to return
    // I need to be careful with replace_file_content range. 
    // I will target the `CardHeader` part only, assuming function signature is handled.
    // Wait, I need to update function destructuring too.
    // I'll assume I can just target the signature line and then the header later? 
    // No, I should do signature in one chunk (which is passed as args).
    // The previous edit handled the "interface" part.
    // This edit handles the component logic.
    // I'll use multi-replace or just one big one? 
    // The function is long. I will split.
    // 1. Function signature update.
    // 2. CardHeader update.
    // 3. Footer update.

    // Step 1: Signature
    // return ...
    //   <Card>
    //     <CardHeader> ...



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
                <CardContent className="py-8 text-center text-muted-foreground">
                    Đang tải thông tin...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Thông tin hành khách</CardTitle>
                        <CardDescription>
                            Vui lòng nhập thông tin cho {seats.length} hành khách
                        </CardDescription>
                    </div>
                    {bookingExpiresAt && (
                        <BookingTimer expiresAt={bookingExpiresAt} />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {passengers.map((passenger, index) => (
                    <div key={passenger.seatId} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Ghế {passenger.seatName}</h3>
                            {cccdInfo[index] && (
                                <Badge variant="secondary" className="gap-1">
                                    <Check className="h-3 w-3" />
                                    {cccdInfo[index]!.groupName} - {cccdInfo[index]!.age} tuổi
                                </Badge>
                            )}
                        </div>

                        {/* Age Category */}
                        <div className="space-y-2">
                            <Label>Độ tuổi</Label>
                            <RadioGroup
                                value={passenger.ageCategory}
                                onValueChange={(value: string) => updatePassenger(index, 'ageCategory', value)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="child" id={`child-${index}`} />
                                    <Label htmlFor={`child-${index}`} className="font-normal cursor-pointer">
                                        Dưới 14 tuổi (Trẻ em)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="adult" id={`adult-${index}`} />
                                    <Label htmlFor={`adult-${index}`} className="font-normal cursor-pointer">
                                        Từ 14 tuổi trở lên
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Passenger Name */}
                        <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>
                                Họ và tên <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id={`name-${index}`}
                                placeholder="Nguyễn Văn A"
                                value={passenger.passengerName}
                                onChange={(e) => updatePassenger(index, 'passengerName', e.target.value)}
                            />
                        </div>

                        {/* CCCD (only for adults) */}
                        {passenger.ageCategory === 'adult' && (
                            <div className="space-y-2">
                                <Label htmlFor={`cccd-${index}`}>
                                    Số CCCD/CMND <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id={`cccd-${index}`}
                                    placeholder="001203012345 (12 số)"
                                    value={passenger.passengerId}
                                    onChange={(e) => updatePassenger(index, 'passengerId', e.target.value)}
                                    maxLength={12}
                                    pattern="[0-9]*"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nhập 12 số CCCD để tự động xác định nhóm hành khách và giảm giá
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {errors[index] && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors[index]}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                ))}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    {bookingCode ? (
                        <div className="flex-1 flex gap-2">
                            <Button variant="outline" onClick={onCancel} className="flex-1">
                                Quay lại
                            </Button>
                            <CancelBookingButton
                                bookingCode={bookingCode}
                                className="flex-1"
                                onCancelSuccess={onCancel}
                                variant="destructive"
                            >
                                Hủy đơn
                            </CancelBookingButton>
                        </div>
                    ) : (
                        <Button variant="outline" onClick={onCancel} className="flex-1">
                            Quay lại
                        </Button>
                    )}

                    <Button onClick={handleSubmit} className="flex-1">
                        {submitLabel}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
