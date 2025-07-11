import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { seatableClient } from '@/lib/seatableClient';
import { 
  ColumnMetadata, 
  UseSeatableMentorsOptions, 
  SeaTableRow 
} from '@/types/seaTableTypes';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useSeatableMentors(options: UseSeatableMentorsOptions = {}) {
  const queryClient = useQueryClient();
  
  const { 
    tableName = 'Neue_MentorInnen',
    idField = 'Mentor_ID',
    viewName
  } = options;

  // Create a specific query key that includes the view
  const queryKey = [QUERY_KEYS.SEATABLE_MENTORS, tableName, viewName || 'no-view'];
  
  // Use ref to store the refetch function to make it stable
  const refetchRef = useRef<() => Promise<any>>();
  
  // Query to get data - ONLY runs when explicitly called
  const {
    data: mentors,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[useSeatableMentors] Fetching data for:', { tableName, viewName });
      
      if (viewName) {
        return await seatableClient.getTableRowsByView(tableName, viewName, true);
      } else {
        return await seatableClient.getTableRows(tableName, undefined, true);
      }
    },
    enabled: false, // Don't auto-fetch - only fetch when explicitly triggered
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Store the refetch function in ref to make it stable
  refetchRef.current = refetch;
  
  // Manual fetch function - NOW STABLE
  const fetchMentors = useCallback(async () => {
    console.log('[useSeatableMentors] Manual fetch triggered');
    return await refetchRef.current?.();
  }, []); // Empty dependency array makes it stable
  
  // Get table metadata
  const getTableMetadata = useCallback(async (tableName: string): Promise<ColumnMetadata> => {
    try {
      const tableStructure = await seatableClient.getTableStructure(tableName);
      const metadata: ColumnMetadata = {};
      
      if (tableStructure?.columns) {
        tableStructure.columns.forEach(column => {
          metadata[column.name] = {
            type: column.type,
            key: column.key,
            name: column.name
          };
        });
      }
      
      return metadata;
    } catch (error) {
      console.error('[useSeatableMentors] Error getting table metadata:', error);
      return {};
    }
  }, []);

  // Get a single mentor by ID
  const getMentorById = useCallback(async (mentorId: string, forceRefresh = false): Promise<SeaTableRow | null> => {
    if (!mentorId) return null;
    
    try {
      let result: SeaTableRow | null = null;
      
      if (viewName) {
        // If we have a view, get data from that view
        const viewData = await seatableClient.getTableRowsByView(tableName, viewName, forceRefresh);
        result = viewData.find(m => m[idField] === mentorId) || null;
      } else {
        // Use filtered query for direct lookup
        const rows = await seatableClient.getFilteredRows(tableName, idField, mentorId);
        result = rows.length > 0 ? rows[0] : null;
      }
      
      return result;
    } catch (err) {
      console.error(`[useSeatableMentors] Error getting mentor by ID ${mentorId}:`, err);
      return null;
    }
  }, [tableName, idField, viewName]);

  // Try alternate tables if the mentor is not found
  const tryAlternateTables = useCallback(async (mentorId: string): Promise<SeaTableRow | null> => {
    try {
      // Try the same table but without view filtering
      const rows = await seatableClient.getFilteredRows(tableName, idField, mentorId);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error(`[useSeatableMentors] Error trying alternate lookup for ${mentorId}:`, err);
      return null;
    }
  }, [tableName, idField]);
  
  // Update a field in a row
  const updateMentorField = useMutation({
    mutationFn: async ({mentorId, field, value}: {mentorId: string, field: string, value: any}) => {
      const rows = await seatableClient.getFilteredRows(tableName, idField, mentorId);
      
      if (rows.length === 0) {
        throw new Error(`Record with ${idField}=${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      return await seatableClient.updateRow(tableName, rowId, { [field]: value });
    },
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEATABLE_MENTORS] });
      }
    }
  });
  
  // Update multiple fields
  const updateMentor = useMutation({
    mutationFn: async ({mentorId, data}: {mentorId: string, data: Record<string, any>}) => {
      const rows = await seatableClient.getFilteredRows(tableName, idField, mentorId);
      
      if (rows.length === 0) {
        throw new Error(`Record with ${idField}=${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      return await seatableClient.updateRow(tableName, rowId, data);
    },
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEATABLE_MENTORS] });
      }
    }
  });

  // Helper function to get display name
  const getDisplayName = useCallback((mentor: SeaTableRow | null): string => {
    if (!mentor) return '';
    
    if (mentor['Vorname'] && mentor['Nachname']) 
      return `${mentor['Vorname']} ${mentor['Nachname']}`;
    if (mentor['Vorname']) return mentor['Vorname'] as string;
    if (mentor['E-Mail-Adresse']) return mentor['E-Mail-Adresse'] as string;
    if (mentor['email']) return mentor['email'] as string;
    
    return (mentor[idField] as string) || mentor._id;
  }, [idField]);
  
  // Get all mentors data
  const getAllMentors = useCallback(async () => {
    if (mentors && mentors.length > 0) {
      return mentors;
    }
    
    try {
      const data = await seatableClient.getTableRows(tableName);
      return data || [];
    } catch (error) {
      console.error('[useSeatableMentors] Error getting all mentors:', error);
      return [];
    }
  }, [mentors, tableName]);
  
  // Force refresh function - ALSO MADE STABLE
  const refreshMentors = useCallback(async () => {
    queryClient.removeQueries({ queryKey });
    return await refetchRef.current?.();
  }, [queryKey, queryClient]); // Removed refetch dependency

  return {
    mentors: mentors || [],
    isLoading,
    error,
    fetchMentors, // Now stable
    getMentorById,
    tryAlternateTables,
    updateMentorField: updateMentorField.mutate,
    updateMentor: updateMentor.mutate,
    isUpdating: updateMentorField.isPending || updateMentor.isPending,
    refreshMentors, // Now stable
    getDisplayName,
    getAllMentors,
    getTableMetadata,
  };
}