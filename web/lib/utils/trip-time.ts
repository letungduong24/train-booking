import { addMinutes } from "date-fns";

export type TripTimeLike = {
  departureTime: string | Date;
  endTime?: string | Date | null;
  departureDelayMinutes?: number | null;
  arrivalDelayMinutes?: number | null;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function getDepartureDelayMinutes(trip: TripTimeLike) {
  return trip.departureDelayMinutes ?? 0;
}

export function getArrivalDelayMinutes(trip: TripTimeLike) {
  return trip.arrivalDelayMinutes ?? 0;
}

export function getTotalArrivalDelayMinutes(trip: TripTimeLike) {
  return getDepartureDelayMinutes(trip) + getArrivalDelayMinutes(trip);
}

export function getActualDepartureTime(trip: TripTimeLike) {
  return addMinutes(toDate(trip.departureTime), getDepartureDelayMinutes(trip));
}

export function getActualEndTime(trip: TripTimeLike) {
  if (!trip.endTime) return null;
  return addMinutes(toDate(trip.endTime), getTotalArrivalDelayMinutes(trip));
}

export function getActualArrivalTimeFromScheduled(
  scheduledArrival: Date,
  trip: TripTimeLike,
) {
  return addMinutes(scheduledArrival, getTotalArrivalDelayMinutes(trip));
}

export function hasDepartureDelay(trip: TripTimeLike) {
  return getDepartureDelayMinutes(trip) > 0;
}

export function hasArrivalImpactDelay(trip: TripTimeLike) {
  return getTotalArrivalDelayMinutes(trip) > 0;
}
