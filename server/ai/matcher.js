/**
 * Provider Matching Engine
 * Ranks providers based on multiple factors
 */

const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { timesOverlap } = require('../utils/helpers');

/**
 * Score a provider based on the service request
 */
const scoreProvider = (profile, request, city) => {
  let score = 0;
  const reasons = [];

  // 0. Direct Category match (30 points)
  const reqCatId = (request.category?._id || request.category)?.toString();
  const provCatIds = (profile.categories || []).map((c) => (c._id || c).toString());
  if (reqCatId && provCatIds.includes(reqCatId)) {
    score += 30;
    reasons.push('✓ Verified specialist in this trade');
  }

  // 1. Skills match (40 points)
  const requiredSkills = request.aiClassification?.requiredSkills || [];
  const providerSkills = (profile.skills || []).map((s) => s.name?.toLowerCase() || '');
  const matchedSkills = requiredSkills.filter((rs) =>
    providerSkills.some((ps) => ps.includes(rs.toLowerCase()) || rs.toLowerCase().includes(ps))
  );
  if (matchedSkills.length > 0) {
    score += Math.min(40, matchedSkills.length * 20);
    reasons.push(`✓ ${matchedSkills.join(', ')} skill${matchedSkills.length > 1 ? 's' : ''}`);
  }

  // 2. Service area match (20 points)
  if (city) {
    const servesArea = (profile.serviceAreas || []).some(
      (area) =>
        area.city?.toLowerCase() === city?.toLowerCase() ||
        area.pincode === request.location?.pincode
    );
    if (servesArea) {
      score += 20;
      reasons.push(`✓ Serves ${city}`);
    }
  }

  // 3. Rating (15 points)
  if (profile.rating && profile.rating.count > 0) {
    const ratingScore = Math.round((profile.rating.average / 5) * 15);
    score += ratingScore;
    reasons.push(`✓ ${profile.rating.average} ⭐ rating (${profile.rating.count} reviews)`);
  }

  // 4. Completed jobs (10 points)
  if (profile.totalCompletedJobs > 0) {
    const jobScore = Math.min(10, Math.floor(profile.totalCompletedJobs / 20));
    score += jobScore;
    reasons.push(`✓ ${profile.totalCompletedJobs} completed jobs`);
  }

  // 5. Experience years (10 points)
  if (profile.experience?.years > 0) {
    const expScore = Math.min(10, profile.experience.years * 2);
    score += expScore;
    reasons.push(`✓ ${profile.experience.years} year${profile.experience.years > 1 ? 's' : ''} experience`);
  }

  // 6. Availability (5 points)
  if (profile.isAvailable) {
    score += 5;
    reasons.push('✓ Currently available');
  }

  return { score, reasons };
};

/**
 * Find and rank providers for a service request
 */
const findMatchingProviders = async (serviceRequest, limit = 10) => {
  try {
    const categoryId = serviceRequest.category?._id || serviceRequest.category;

    // First try finding approved providers matching the category
    let profiles = [];
    if (categoryId) {
      profiles = await ProviderProfile.find({
        verificationStatus: 'approved',
        isAvailable: true,
        categories: categoryId,
      })
        .populate('userId', 'name username profileImage mobile location')
        .populate('categories', 'name slug icon');
    }

    // Fall back to all approved available providers if none with specific category
    if (profiles.length === 0) {
      profiles = await ProviderProfile.find({
        verificationStatus: 'approved',
        isAvailable: true,
      })
        .populate('userId', 'name username profileImage mobile location')
        .populate('categories', 'name slug icon');
    }

    if (profiles.length === 0) return [];

    // Score each provider
    const scoredProviders = profiles.map((profile) => {
      const { score, reasons } = scoreProvider(
        profile,
        serviceRequest,
        serviceRequest.location?.city
      );
      return {
        profile,
        user: profile.userId,
        score,
        reasons,
      };
    });

    // Sort by score descending
    scoredProviders.sort((a, b) => b.score - a.score);

    // Return top providers
    return scoredProviders.slice(0, limit).map((sp) => ({
      providerId: sp.user._id,
      providerName: sp.user.name,
      profileImage: sp.profile.profileImage || sp.user.profileImage,
      rating: sp.profile.rating,
      experience: sp.profile.experience.years,
      totalCompletedJobs: sp.profile.totalCompletedJobs,
      skills: sp.profile.skills.slice(0, 5),
      serviceAreas: sp.profile.serviceAreas,
      isAvailable: sp.profile.isAvailable,
      matchScore: sp.score,
      matchReasons: sp.reasons,
      categories: sp.profile.categories,
    }));
  } catch (err) {
    console.error('Provider matching error:', err);
    return [];
  }
};

module.exports = { findMatchingProviders, scoreProvider };
