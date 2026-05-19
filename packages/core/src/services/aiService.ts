/**
 * AI Service — Simulates backend AI recommendations for the Klinflow platform.
 * In a real production environment, this would call an LLM (GPT-4/Claude) 
 * or a specialized optimization engine via REST/GraphQL.
 */
import { AI_PICKUP_TIMES } from '../data/mockData';

export const aiService = {
  /**
   * Fetches smart pickup recommendations for a user.
   * @param {string} profileId - The user's ID
   * @param {Array} smartBins - Current IoT bin states
   * @param {boolean} isIotEnabled - Whether the user has IoT connected
   * @returns {Promise<Array>}
   */
  getRecommendations: async (profileId: string, smartBins: any[] = [], isIotEnabled: boolean = true) => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!isIotEnabled) {
      // TRACK B: Efficiency Mode (No IoT)
      // Prioritize clustering and traffic optimization
      return AI_PICKUP_TIMES.filter((s: any) => 
        s.isAI && (s.type === 'cluster' || s.type === 'traffic' || s.type === 'efficiency')
      ).sort((a: any, b: any) => b.confidence - a.confidence).slice(0, 4);
    }

    // TRACK A: IoT Mode (Urgency)
    // 1. Find the most critical PRIVATE bin
    const privateBins = smartBins.filter((b: any) => b.visibility === 'private');
    const estateBins = smartBins.filter((b: any) => b.visibility === 'estate');

    const criticalPrivate = [...privateBins].sort((a: any, b: any) => b.fillLevel - a.fillLevel)[0];
    const criticalEstate = [...estateBins].sort((a: any, b: any) => b.fillLevel - a.fillLevel)[0];
    
    const recommendations = AI_PICKUP_TIMES.filter((s: any) => s.isAI).map((s: any) => {
      let updatedReason = s.reason;
      let boost = 0;
      let type = s.type;

      // Priority 1: Private Bins (Your House)
      if (criticalPrivate && criticalPrivate.fillLevel > 70) {
        updatedReason = `Your ${criticalPrivate.name} is ${criticalPrivate.fillLevel}% full • ${s.reason}`;
        boost = 15; // Higher boost for personal bins
        type = 'urgency';
      } 
      // Priority 2: Estate Bins (Shared)
      else if (criticalEstate && criticalEstate.fillLevel > 80) {
        updatedReason = `Estate ${criticalEstate.name} is ${criticalEstate.fillLevel}% full • Best to dispose now`;
        boost = 5;
        type = 'cluster';
      }

      return {
        ...s,
        reason: updatedReason,
        fillLevel: criticalPrivate ? criticalPrivate.fillLevel : (criticalEstate ? criticalEstate.fillLevel : s.fillLevel),
        confidence: Math.min(100, s.confidence + boost),
        isUrgent: (criticalPrivate && criticalPrivate.fillLevel > 75) || (criticalEstate && criticalEstate.fillLevel > 90),
        type
      };
    });

    return recommendations.sort((a: any, b: any) => b.confidence - a.confidence).slice(0, 4);
  },

  /**
   * Simulates a "Force Refresh" from the AI engine.
   */
  refreshIntelligence: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Randomly shuffle or re-calculate metrics to show "live" data
    return AI_PICKUP_TIMES
      .map((s: any) => ({
        ...s,
        confidence: Math.min(100, s.confidence + (Math.random() > 0.5 ? 1 : -1)),
        fillLevel: Math.min(100, Math.max(0, s.fillLevel + Math.floor(Math.random() * 5)))
      }))
      .filter((s: any) => s.isAI);
  }
};
