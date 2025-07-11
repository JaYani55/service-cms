import { supabase } from "@/lib/supabase";

// Cache for staff names to avoid redundant fetches
const staffNamesCache = new Map<string, string>();

export interface Staff {
  user_id: string;
  Username: string;
}

// Base query builder to keep queries consistent - UPDATED TO STAFF
const getBaseStaffQuery = () => 
  supabase
    .from('user_profile')
    .select(`
      user_id,
      Username,
      user_roles!inner (
        role_id,
        roles!inner (
          id,
          name
        )
      )
    `)
    .eq('user_roles.roles.name', 'staff');

export const searchStaff = async (searchTerm: string): Promise<Staff[]> => {
  const { data, error } = await getBaseStaffQuery()
    .ilike('Username', `%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error('Error searching staff:', error);
    return [];
  }

  const staff = data?.map(item => ({
    user_id: item.user_id,
    Username: item.Username
  })) || [];

  // Update cache with fetched staff
  staff.forEach(staffMember => {
    staffNamesCache.set(staffMember.user_id, staffMember.Username);
  });

  return staff;
};

export const getStaffById = async (id: string): Promise<Staff | null> => {
  // Check cache first
  if (staffNamesCache.has(id)) {
    return {
      user_id: id,
      Username: staffNamesCache.get(id)!
    };
  }

  const { data, error } = await getBaseStaffQuery()
    .eq('user_id', id)
    .single();

  if (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }

  if (data) {
    const staffMember = {
      user_id: data.user_id,
      Username: data.Username
    };
    staffNamesCache.set(staffMember.user_id, staffMember.Username);
    return staffMember;
  }

  return null;
};

export const fetchStaffNames = async (staffIds: string[]): Promise<Record<string, string>> => {
  try {
    // Filter out IDs we already have cached
    const uncachedIds = staffIds.filter(id => !staffNamesCache.has(id));
    
    if (uncachedIds.length > 0) {
      const { data, error } = await getBaseStaffQuery()
        .in('user_id', uncachedIds);
      
      if (error) throw error;
      
      // Update cache with new data
      data?.forEach(user => {
        staffNamesCache.set(user.user_id, user.Username || 'Unnamed');
      });
    }
    
    // Return mapping for all requested IDs
    return staffIds.reduce((acc, id) => {
      acc[id] = staffNamesCache.get(id) || 'Unknown';
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error("Error fetching staff names:", error);
    return {};
  }
};

// Keep old exports for backward compatibility during transition
export const searchCoaches = searchStaff;
export const getCoachById = getStaffById;
export type Coach = Staff;