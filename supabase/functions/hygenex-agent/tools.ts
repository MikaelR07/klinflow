// Tools for Gemini Flash

export const ALL_TOOLS = [
  {
    name: "query_marketplace",
    description: "Search active marketplace listings by material or check current market prices. Returns live listings.",
    parameters: {
      type: "OBJECT",
      properties: {
        material: { type: "STRING", description: "The material to search for, e.g., plastic, metal, PET" }
      },
      required: ["material"]
    }
  },
  {
    name: "get_active_swarms",
    description: "Get active Swarm operations (high-density community pickups). Returns read-only information about where Swarms are happening so you can tell the user about the opportunity.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: []
    }
  },
  {
    name: "get_pending_pickups",
    description: "Get pending pickup requests that need an agent (Agent and Company Owner only).",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "INTEGER", description: "Number of pickups to return" }
      },
      required: []
    }
  }
];

export const getToolsForRole = (role: string) => {
  // For Phase 1, we share the read-only tools to simplify, but the prompt limits how they are discussed.
  return ALL_TOOLS;
};

// Tool Executor mapped to Supabase
export const executeTool = async (supabase: any, toolName: string, args: any, userId: string) => {
  try {
    switch (toolName) {
      case "query_marketplace": {
        let query = supabase.from('marketplace_listings').select('id, material, price_per_kg, quantity, location').eq('status', 'active');
        if (args.material) {
          query = query.ilike('material', `%${args.material}%`);
        }
        const { data, error } = await query.limit(5);
        if (error) throw error;
        return { success: true, result: data || [] };
      }
      
      case "get_active_swarms": {
        const { data, error } = await supabase.from('swarms').select('id, name, location, target_material, status').eq('status', 'active').limit(5);
        if (error) throw error;
        return { success: true, result: data || [] };
      }

      case "get_pending_pickups": {
        const limit = args.limit || 5;
        const { data, error } = await supabase.from('bookings').select('id, waste_type, estate, weight_kg, created_at').eq('status', 'pending').limit(limit);
        if (error) throw error;
        return { success: true, result: data || [] };
      }

      default:
        return { success: false, error: `Tool ${toolName} not found or not implemented yet.` };
    }
  } catch (err: any) {
    console.error(`[Tool Executor Error] ${toolName}:`, err);
    return { success: false, error: err.message };
  }
};
