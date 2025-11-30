// services/recommendationService.js
class RecommendationService {
  static async getPersonalizedRecommendations(user) {
    const schemes = await Scheme.find({ isActive: true });
    
    // Calculate scores using multiple factors
    const recommendations = schemes.map(scheme => {
      const baseScore = scheme.calculateMatchScore(user);
      
      // Boost scores based on user behavior
      const behaviorBoost = this.calculateBehaviorBoost(user, scheme);
      const finalScore = Math.min(100, baseScore + behaviorBoost);
      
      return {
        scheme,
        matchScore: finalScore,
        reasons: this.generateRecommendationReasons(user, scheme, finalScore)
      };
    });
    
    return recommendations
      .filter(rec => rec.matchScore >= 40) // Minimum threshold
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8); // Top 8 recommendations
  }
  
  static calculateBehaviorBoost(user, scheme) {
    let boost = 0;
    
    // Boost if user has similar schemes applied
    // Boost based on location match
    // Boost based on crop compatibility
    // etc.
    
    return boost;
  }
}