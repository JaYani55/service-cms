import { supabase } from '../../lib/supabase';

export interface Employer {
  id: string;
  name: string;
  logo_url?: string;
}

// Replace your searchEmployers function with this simplified version
export const searchEmployers = async (query: string): Promise<Employer[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    console.log("Searching with query:", query);
    
    const { data, error } = await supabase
      .from('employers')
      .select('id, name, logo_url')
      .ilike('name', `%${query.trim()}%`)
      .limit(10);

    if (error) {
      console.error('Error searching employers:', error);
      return [];
    }

    console.log(`Found ${data?.length || 0} results:`, data);
    return data || [];
  } catch (err) {
    console.error('Exception in searchEmployers:', err);
    return [];
  }
};

export const getEmployerById = async (id: string): Promise<Employer | null> => {
  if (!id) return null;

  try {
    const { data, error } = await supabase
      .from('employers')
      .select('id, name, logo_url')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching employer:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in getEmployerById:', err);
    return null;
  }
};

export const testDirectEmployerQuery = async (): Promise<any> => {
  try {
    // Test basic connection and permissions
    const { data, error } = await supabase
      .from('employers')
      .select('id, name')
      .limit(3);
    
    console.log("Direct query test results:", { data, error });
    return { success: !error, count: data?.length || 0, data, error };
  } catch (err) {
    console.error("Direct query test failed:", err);
    return { success: false, error: err };
  }
};