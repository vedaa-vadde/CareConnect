const Availability = require('../models/Availability');
const { sendSuccess, sendError } = require('../utils/response.util');
const { checkProviderAvailability } = require('../services/availability.service');

// @desc    Set/update availability (provider)
// @route   POST /api/availability
// @access  Provider (approved)
const setAvailability = async (req, res) => {
  try {
    const { date, slots, isAvailable } = req.body;

    let parsedSlots = slots;
    if (typeof slots === 'string') {
      try { parsedSlots = JSON.parse(slots); } catch { parsedSlots = []; }
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Validate no overlapping slots
    if (parsedSlots && parsedSlots.length > 1) {
      for (let i = 0; i < parsedSlots.length; i++) {
        for (let j = i + 1; j < parsedSlots.length; j++) {
          const s1 = parsedSlots[i];
          const s2 = parsedSlots[j];
          if (timesOverlapSimple(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            return sendError(res, 'Availability slots cannot overlap.', 400);
          }
        }
      }
    }

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];

    const availability = await Availability.findOneAndUpdate(
      { providerId: req.user._id, date: { $gte: targetDate, $lt: nextDay } },
      {
        providerId: req.user._id,
        date: targetDate,
        dayOfWeek,
        slots: parsedSlots || [],
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, { availability }, 'Availability updated.');
  } catch (err) {
    return sendError(res, 'Failed to set availability.', 500);
  }
};

// @desc    Get provider availability
// @route   GET /api/availability/:providerId
// @access  Public
const getProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { from, to } = req.query;

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const availability = await Availability.find({
      providerId,
      date: { $gte: fromDate, $lte: toDate },
    }).sort({ date: 1 });

    return sendSuccess(res, { availability }, 'Availability fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch availability.', 500);
  }
};

// @desc    Get my availability (provider)
// @route   GET /api/availability/me
// @access  Provider
const getMyAvailability = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const availability = await Availability.find({
      providerId: req.user._id,
      date: { $gte: fromDate, $lte: toDate },
    }).sort({ date: 1 });

    return sendSuccess(res, { availability }, 'Availability fetched.');
  } catch (err) {
    return sendError(res, 'Failed to fetch availability.', 500);
  }
};

// @desc    Check if provider is available for a date/time
// @route   POST /api/availability/check
// @access  Customer
const checkAvailability = async (req, res) => {
  try {
    const { providerId, date, startTime, endTime } = req.body;
    const result = await checkProviderAvailability(providerId, date, startTime, endTime);
    return sendSuccess(res, result, result.available ? 'Provider is available.' : 'Provider is not available.');
  } catch (err) {
    return sendError(res, 'Failed to check availability.', 500);
  }
};

const timesOverlapSimple = (s1, e1, s2, e2) => {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(s1) < toMin(e2) && toMin(e1) > toMin(s2);
};

module.exports = { setAvailability, getProviderAvailability, getMyAvailability, checkAvailability };
