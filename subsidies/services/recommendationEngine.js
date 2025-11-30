// services/recommendationEngine.js
class RecommendationEngine {
  static calculateEnhancedMatchScore(user, scheme) {
    let score = 0;
    const fp = user.financialProfile;
    
    // Base eligibility (50 points)
    const baseEligibility = scheme.checkEligibility(user);
    if (baseEligibility.eligible) score += 50;
    
    // Document completeness (20 points)
    const docCount = Object.values(fp.documents).filter(Boolean).length;
    score += (docCount / 4) * 20;
    
    // Location preference (15 points)
    if (fp.district && scheme.eligibility.applicableDistricts.includes(fp.district)) {
      score += 15;
    }
    
    // Crop matching (15 points)
    if (scheme.eligibility.applicableCrops.length > 0) {
      const cropMatch = fp.crops.some(crop => 
        scheme.eligibility.applicableCrops.includes(crop)
      );
      if (cropMatch) score += 15;
    }
    
    return Math.min(100, score);
  }
}