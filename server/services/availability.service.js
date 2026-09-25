/**
 * Availability Service
 * Handles provider availability management and conflict detection
 */

const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { timesOverlap } = require('../utils/helpers');

/**
 * Check if a provider is available for a given date + time window
 */
const checkProviderAvailability = async (providerId, date, startTime, endTime) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // 1. Check existing accepted bookings for overlap
  const existingBookings = await Booking.find({
    providerId,
    scheduledDate: { $gte: targetDate, $lt: nextDay },
    status: {
      $in: ['accepted', 'on_the_way', 'in_progress', 'pending_acceptance'],
    },
  });

  for (const booking of existingBookings) {
    const bookingStart = booking.scheduledTime;
    const bookingEnd = booking.estimatedEndTime || addHours(booking.scheduledTime, 2);
    if (timesOverlap(startTime, endTime, bookingStart, bookingEnd)) {
      return {
        available: false,
        reason: 'Provider has an overlapping booking at this time.',
        conflictingBookingId: booking._id,
      };
    }
  }

  // 2. Check availability slots
  const avail = await Availability.findOne({
    providerId,
    date: { $gte: targetDate, $lt: nextDay },
  });

  if (avail && !avail.isAvailable) {
    return { available: false, reason: 'Provider is marked as unavailable for this date.' };
  }

  if (avail && avail.slots.length > 0) {
    const blockedSlots = avail.slots.filter((s) => s.status === 'blocked');
    for (const slot of blockedSlots) {
      if (timesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return { available: false, reason: 'Provider has a blocked time slot.' };
      }
    }
  }

  return { available: true };
};

/**
 * Mark a time slot as booked
 */
const markSlotBooked = async (providerId, date, startTime, endTime, bookingId) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  let avail = await Availability.findOne({
    providerId,
    date: { $gte: targetDate, $lt: nextDay },
  });

  if (!avail) {
    avail = new Availability({ providerId, date: targetDate, slots: [] });
  }

  avail.slots.push({
    startTime,
    endTime,
    status: 'booked',
    bookingId,
  });

  await avail.save();
};

/**
 * Release a booked slot when booking is cancelled
 */
const releaseSlot = async (providerId, bookingId) => {
  await Availability.updateMany(
    { providerId, 'slots.bookingId': bookingId },
    { $pull: { slots: { bookingId } } }
  );
};

/**
 * Add hours to a time string "HH:MM"
 */
const addHours = (timeStr, hours) => {
  if (!timeStr) return '23:59';
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

module.exports = { checkProviderAvailability, markSlotBooked, releaseSlot };
