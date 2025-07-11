import React, { useState, useEffect } from 'react';
import { useSeatableMentors } from '@/hooks/useSeatableMentors';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Table2, RefreshCcw, AlertCircle, AlertTriangle, Database, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';
import { seatableClient } from '@/lib/seatableClient';
import { SeaTableDebug } from '@/components/debug/SeaTableDebug';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

export const SeaTableDataTest = () => {
  // Add this hook to get the query client instance
  const queryClient = useQueryClient();
  
  // Default to "Neue_MentorInnen" table with "Mentor_ID" as the ID field
  const [tableName, setTableName] = useState<string>('Neue_MentorInnen');
  const [idField, setIdField] = useState<string>('Mentor_ID');
  const [viewName, setViewName] = useState<string>('intern'); // Try 'intern' instead of '__no_view__'
  const [availableViews, setAvailableViews] = useState<string[]>([]); // Store available views
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [supabaseUsers, setSupabaseUsers] = useState<Record<string, any>>({});
  const [loadingSupabase, setLoadingSupabase] = useState<boolean>(false);
  const [verificationResults, setVerificationResults] = useState<{
    total: number;
    matched: number;
    unmatched: number;
    matchedIds: string[];
    unmatchedIds: string[];
  }>({ total: 0, matched: 0, unmatched: 0, matchedIds: [], unmatchedIds: [] });
  
  // Add state to store full table data (unfiltered)  
  const [fullTableData, setFullTableData] = useState<any[]>([]);
  
  // Use the hook with our specified table AND view
  const { 
    mentors, // This is the view-filtered data
    isLoading, 
    error, 
    refreshMentors,
    getMentorById,
    getDisplayName
  } = useSeatableMentors({ 
    tableName, 
    idField, 
    viewName: viewName === "__no_view__" ? undefined : viewName || undefined 
  });

  // State for a single row's data
  const [singleRowData, setSingleRowData] = useState<any>(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [supabaseUserData, setSupabaseUserData] = useState<any>(null);
  
  // Replace the hardcoded table list with:
  const [availableTables, setAvailableTables] = useState<{name: string; idField: string}[]>([
    { name: 'Neue_MentorInnen', idField: 'Mentor_ID' } // Keep your known table as default
  ]);
  
  // Add a new state to track the reason why data is missing
  const [registrationStatus, setRegistrationStatus] = useState<'no_mentor_id' | 'no_supabase_match' | null>(null);
  
  // Function to load available views for the selected table
  const loadAvailableViews = async (tableNameToCheck: string) => {
    try {
      // FORCE clear all SeaTable cache first
      localStorage.removeItem('seatable_metadata');
      localStorage.removeItem('seatable_base_token');
      localStorage.removeItem('seatable_base_uuid');
      localStorage.removeItem('seatable_server_url');
      localStorage.removeItem('seatable_token_timestamp');
      
      // Force refresh metadata with a completely fresh request
      const tableStructure = await seatableClient.getTableStructure(tableNameToCheck);
      
      // If still getting old data, force another refresh
      if (!tableStructure || !tableStructure.views) {
        await seatableClient.getMetadata(true); // Force refresh
        const refreshedStructure = await seatableClient.getTableStructure(tableNameToCheck);
        
        if (refreshedStructure && refreshedStructure.views) {
          const viewNames = refreshedStructure.views.map((view: any) => view.name || view.view_name || 'Unnamed View');
          setAvailableViews(viewNames);
          
          // Set default view logic
          if (viewNames.length > 0) {
            if (tableNameToCheck === 'Neue_MentorInnen' && viewNames.includes('extern')) {
              setViewName('extern');
            } else if (tableNameToCheck === 'Neue_MentorInnen' && viewNames.includes('intern')) {
              setViewName('intern');
            } else {
              setViewName(viewNames[0]);
            }
          } else {
            setViewName('__no_view__');
          }
        } else {
          setAvailableViews([]);
          setViewName('__no_view__');
        }
      } else {
        const viewNames = tableStructure.views.map((view: any) => view.name || view.view_name || 'Unnamed View');
        
        setAvailableViews(viewNames);
        
        // Set default view logic
        if (viewNames.length > 0) {
          if (tableNameToCheck === 'Neue_MentorInnen' && viewNames.includes('extern')) {
            setViewName('extern');
          } else if (tableNameToCheck === 'Neue_MentorInnen' && viewNames.includes('intern')) {
            setViewName('intern');
          } else {
            setViewName(viewNames[0]);
          }
        } else {
          setViewName('__no_view__');
        }
      }
    } catch (error) {
      console.error(`Error loading views for table ${tableNameToCheck}:`, error);
      setAvailableViews([]);
      setViewName('__no_view__');
    }
  };

  // Verify connection between SeaTable mentors and Supabase users
  const verifySupabaseConnection = async () => {
    // Use full table data instead of view-filtered data for verification
    if (!fullTableData || fullTableData.length === 0) {
      console.warn("No full table data available for verification");
      return;
    }
    
    setLoadingSupabase(true);
    
    try {
      // Extract all Mentor_IDs from FULL TABLE DATA
      const mentorIds = fullTableData
        .map(m => m[idField])
        .filter(Boolean) as string[];
      
      // Lookup each ID in Supabase
      const results: Record<string, any> = {};
      const matched: string[] = [];
      const unmatched: string[] = [];
      
      // Process in batches of 10 to avoid rate limits
      for (let i = 0; i < mentorIds.length; i += 10) {
        const batch = mentorIds.slice(i, i + 10);
        
        // Query Supabase for this batch of IDs
        const { data, error } = await supabase
          .from('user_profile')
          .select('user_id, Username, email')
          .in('user_id', batch);
          
        if (error) {
          console.error("Supabase query error:", error);
          continue;
        }
        
        // Store results by ID
        for (const user of data || []) {
          results[user.user_id] = user;
          matched.push(user.user_id);
        }
        
        // Find unmatched IDs from this batch
        for (const id of batch) {
          if (!results[id]) {
            unmatched.push(id);
          }
        }
        
        // Add a small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Set the results
      setSupabaseUsers(results);
      setVerificationResults({
        total: mentorIds.length,
        matched: matched.length,
        unmatched: unmatched.length,
        matchedIds: matched,
        unmatchedIds: unmatched
      });
      
    } catch (err) {
      console.error("Error verifying Supabase connection:", err);
    } finally {
      setLoadingSupabase(false);
    }
  };
  
  // Load data on table change
  useEffect(() => {
    if (mentors && mentors.length > 0) {
      // Clear previous verification results
      setVerificationResults({ total: 0, matched: 0, unmatched: 0, matchedIds: [], unmatchedIds: [] });
      setSupabaseUsers({});
      setSupabaseUserData(null);
    }
  }, [tableName, viewName]); // Add viewName to dependency array
  
  // Load available views when table changes
  useEffect(() => {
    if (tableName) {
      loadAvailableViews(tableName);
      // Clear selected row when table or view changes
      setSelectedRow(null);
      setSingleRowData(null);
      setSupabaseUserData(null);
    }
  }, [tableName]);

  // Add useEffect to fetch full table data when table changes
  useEffect(() => {
    const fetchFullTableData = async () => {
      if (tableName) {
        try {
          // Always fetch the complete table data without view filtering
          const fullData = await seatableClient.getTableRows(tableName);
          setFullTableData(fullData);
        } catch (error) {
          console.error(`Error fetching full table data for ${tableName}:`, error);
          setFullTableData([]);
        }
      }
    };

    fetchFullTableData();
  }, [tableName]); // Only depend on tableName, not viewName

  // Load a specific row when selected
  const loadSingleRow = async (seaTableRowId: string) => {
    if (!seaTableRowId) return;
    
    // IMPORTANT: Clear everything first
    setLoadingSingle(true);
    setSingleRowData(null);
    setSupabaseUserData(null);
    setRegistrationStatus(null);
    
    try {
      // Get the row data from the VIEW-FILTERED data (for display)
      const rowData = mentors.find(row => row._id === seaTableRowId);
      
      if (!rowData) {
        setSingleRowData(null);
        setSupabaseUserData(null);
        setLoadingSingle(false);
        return;
      }
      
      // Set the SeaTable data first (from the view)
      setSingleRowData(rowData);
      
      // *** KEY CHANGE: Check Mentor_ID from FULL TABLE DATA, not view data ***
      let mentorId = null;
      
      // Find the same row in the full table data to get the Mentor_ID
      const fullRowData = fullTableData.find(row => row._id === seaTableRowId);
      if (fullRowData) {
        mentorId = fullRowData[idField];
      } else {
        console.warn(`[DEBUG] Could not find row ${seaTableRowId} in full table data`);
      }
      
      // Check if this row has a valid Mentor_ID (from full table)
      const hasMentorId = !!mentorId && typeof mentorId === 'string' && mentorId.length > 10;
      
      if (!hasMentorId) {
        // No Mentor_ID, so definitely registration in process
        setRegistrationStatus('no_mentor_id');
        setSupabaseUserData(null);
        setLoadingSingle(false);
        return;
      }
      
      // Now check Supabase with the Mentor_ID
      const { data: userData, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', mentorId)
        .single();
        
      if (!error && userData) {
        setSupabaseUserData(userData);
        setRegistrationStatus(null);
      } else {
        setRegistrationStatus('no_supabase_match');
        setSupabaseUserData(null);
      }
    } catch (err) {
      console.error("Error loading row data:", err);
      setSingleRowData(null);
      setSupabaseUserData(null);
    } finally {
      setLoadingSingle(false);
    }
  };

  // Add this useEffect to load actual tables
  useEffect(() => {
    const loadTables = async () => {
      try {
        const tables = await seatableClient.listTables();
        // Create table objects with default idField (can be changed by user)
        const tableObjects = tables.map(name => ({ name, idField: 'Mentor_ID' }));
        setAvailableTables(tableObjects);
      } catch (err) {
        console.error("Failed to load tables from SeaTable:", err);
      }
    };
    
    loadTables();
  }, []);

  // Add this function
  const forceRefreshViews = async () => {
    try {
      // Clear ALL SeaTable related cache
      localStorage.removeItem('seatable_metadata');
      localStorage.removeItem('seatable_base_token');
      localStorage.removeItem('seatable_base_uuid');
      localStorage.removeItem('seatable_server_url');
      localStorage.removeItem('seatable_token_timestamp');
      
      // Wait a moment for storage to clear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh metadata multiple times if needed
      await seatableClient.getMetadata(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      await seatableClient.getMetadata(true);
      
      // Reload views
      await loadAvailableViews(tableName);
    } catch (error) {
      console.error('Error force refreshing views:', error);
    }
  };

  // Add this function
  const forceClearAllCache = () => {
    // Clear localStorage
    localStorage.removeItem('seatable_metadata');
    localStorage.removeItem('seatable_base_token');
    localStorage.removeItem('seatable_base_uuid');
    localStorage.removeItem('seatable_server_url');
    localStorage.removeItem('seatable_token_timestamp');
    
    // Clear React Query cache using the instance
    queryClient.clear();
    
    console.log('[DEBUG] All cache cleared');
    
    // Reload the page
    window.location.reload();
  };

  // Add this test function
  const testApiConnection = async () => {
    try {
      console.log('[DEBUG] Testing API connection...');
      
      // Try to generate a base token
      const { axiosInstance, baseUuid, serverUrl } = await seatableClient.getAxiosInstance(true);
      
      console.log('[DEBUG] Connection successful:', { baseUuid, serverUrl });
      
      // Try to fetch metadata
      const metadata = await seatableClient.getMetadata(true);
      console.log('[DEBUG] Metadata fetched:', metadata);
      
    } catch (error) {
      console.error('[DEBUG] Connection failed:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Add this temporarily for debugging */}
      <SeaTableDebug />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table2 className="h-6 w-6 text-primary" />
              SeaTable-Supabase Connection Test
            </div>
            <div className="text-sm text-muted-foreground">
              Verify connection between SeaTable and Supabase
            </div>
          </CardTitle>
          <CardDescription>
            This tool verifies if the Mentor_IDs in SeaTable correspond to valid user IDs in Supabase.
            You can also filter data by specific views within each table.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Configuration controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-md">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">SeaTable Table</label>
              <Select 
                value={tableName} 
                onValueChange={(value) => {
                  const table = availableTables.find(t => t.name === value);
                  setTableName(value);
                  if (table) {
                    setIdField(table.idField);
                  }
                  setSingleRowData(null);
                  setSelectedRow(null);
                  // Views will be loaded by useEffect
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>{table.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Selection */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Table View</label>
              <div className="flex gap-2">
                <Select 
                  value={viewName} 
                  onValueChange={(value) => {
                    setViewName(value);
                    setSingleRowData(null);
                    setSelectedRow(null);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select view (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_view__">All Data (No View Filter)</SelectItem>
                    {availableViews.map((view) => (
                      <SelectItem key={view} value={view}>{view}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceRefreshViews}
                  className="px-2"
                  title="Refresh views from SeaTable"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              
              {availableViews.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No views available for this table
                </p>
              )}
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">ID Field (Supabase UUID)</label>
              <input 
                type="text" 
                value={idField} 
                onChange={(e) => setIdField(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <Button 
                onClick={() => {
                  console.log('[DEBUG] User clicked refresh - forcing complete refresh');
                  // Clear localStorage to force new token
                  localStorage.removeItem('seatable_base_token');
                  localStorage.removeItem('seatable_base_uuid');
                  localStorage.removeItem('seatable_server_url');
                  localStorage.removeItem('seatable_token_timestamp');
                  localStorage.removeItem('seatable_metadata');
                  
                  // Force refresh
                  refreshMentors();
                }}
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Force Refresh
              </Button>
              
              <Button 
                onClick={verifySupabaseConnection}
                variant="default"
                size="sm"
                className="gap-1"
                disabled={isLoading || loadingSupabase || mentors.length === 0}
              >
                {loadingSupabase ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Verify Connections
              </Button>
            </div>
          </div>

          {/* Enhanced Configuration Display */}
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
            <strong>Current Configuration:</strong> 
            Table: <code>{tableName}</code>
            {viewName && viewName !== '__no_view__' && (
              <>, View: <code>{viewName}</code> (showing {mentors.length} of {fullTableData.length} rows)</>
            )}
            , ID Field: <code>{idField}</code>
            {availableViews.length > 0 && (
              <>
                <br />
                <strong>Available Views:</strong> {availableViews.join(', ')}
              </>
            )}
            <br />
            <strong>Data Status:</strong> View data: {mentors.length} rows, Full table: {fullTableData.length} rows
          </div>
          
          {/* Status indicator */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading data from SeaTable...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">Error loading data:</p>
                <p className="whitespace-pre-wrap">{String(error)}</p>
              </div>
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p>No data found in table <strong>{tableName}</strong>
                {viewName && <> with view <strong>{viewName}</strong></>}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different table/view or check your SeaTable configuration
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connection verification results */}
              {verificationResults.total > 0 && (
                <Card className="border border-blue-100 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Connection Verification Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-around mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{verificationResults.total}</div>
                        <div className="text-sm text-muted-foreground">Total IDs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{verificationResults.matched}</div>
                        <div className="text-sm text-muted-foreground">Matched</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{verificationResults.unmatched}</div>
                        <div className="text-sm text-muted-foreground">Unmatched</div>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Matched IDs:</h4>
                        <div className="max-h-[200px] overflow-y-auto bg-white p-2 rounded-md">
                          {verificationResults.matchedIds.slice(0, 10).map(id => (
                            <div key={id} className="text-xs font-mono">{id}</div>
                          ))}
                          {verificationResults.matchedIds.length > 10 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {verificationResults.matchedIds.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Unmatched IDs:</h4>
                        <div className="max-h-[200px] overflow-y-auto bg-white p-2 rounded-md">
                          {verificationResults.unmatchedIds.slice(0, 10).map(id => (
                            <div key={id} className="text-xs font-mono text-red-600">{id}</div>
                          ))}
                          {verificationResults.unmatchedIds.length > 10 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {verificationResults.unmatchedIds.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            
              {/* Row selection for detailed view */}
              <div>
                <h3 className="text-lg font-medium mb-3">Examine Individual Records</h3>
                <label className="text-sm font-medium mb-1 block">
                  Select a record to view details:
                </label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedRow || ''} 
                    onValueChange={(value) => {
                      setSelectedRow(value);
                      loadSingleRow(value);
                    }}
                  >
                    <SelectTrigger className="w-[350px]">
                      <SelectValue placeholder="Select a row" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.slice(0, 50).map((row, index) => {
                        const displayName = getDisplayName(row);
                        return (
                          <SelectItem key={row._id} value={row._id}>
                            {index + 1}. {displayName}
                          </SelectItem>
                        );
                      })}
                      {mentors.length > 50 && (
                        <SelectItem value="" disabled>
                          ... showing first 50 of {mentors.length} rows
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingSingle || !selectedRow}
                    onClick={() => selectedRow && loadSingleRow(selectedRow)}
                  >
                    {loadingSingle ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Refresh
                  </Button>
                </div>
              </div>
              
              {/* Data comparison */}
              {selectedRow && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* SeaTable Data */}
                  <Card>
                    <CardHeader className="bg-slate-50 py-3">
                      <CardTitle className="text-md flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        SeaTable Data
                        {viewName && viewName !== '__no_view__' && (
                          <Badge variant="outline" className="ml-2">
                            View: {viewName}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingSingle ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                          <span>Loading...</span>
                        </div>
                      ) : !singleRowData ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No data found
                        </div>
                      ) : (
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Row ID: <code>{singleRowData._id}</code>
                          </p>
                          
                          <div className="overflow-auto max-h-[300px]">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2 font-medium">Field</th>
                                  <th className="text-left p-2 font-medium">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(singleRowData)
                                  .filter(([key]) => key !== '_id')
                                  .map(([key, value]) => (
                                    <tr key={key} className="border-b">
                                      <td className="p-2 font-mono text-xs">{key}</td>
                                      <td className="p-2">
                                        {value === null || value === undefined || value === '' 
                                          ? <span className="text-muted-foreground italic">empty</span>
                                          : String(value)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Supabase Data */}
                  <Card>
                    <CardHeader className="bg-slate-50 py-3">
                      <CardTitle className="text-md flex items-center gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.9347 10.0064C21.8039 9.73212 21.5677 9.5329 21.2873 9.4488L7.29967 5.24267C6.83838 5.09704 6.55327 5 6.32327 5C5.98371 5 5.8142 5.17486 5.74049 5.28269C5.59432 5.49511 5.56676 5.79572 5.66676 6.18895L5.70435 6.31346L8.15432 16.1212C8.32567 16.8161 8.4133 17.1651 8.55509 17.3543C8.68218 17.5231 8.84433 17.6583 9.02743 17.7494C9.22869 17.85 9.47656 17.8516 9.96572 17.8516H11.9636C12.9498 17.8516 13.443 17.8516 13.8242 17.649C14.1585 17.4707 14.4314 17.1978 14.6097 16.8635C14.8123 16.4823 14.8123 15.9892 14.8123 15.0029V13.2921C14.8123 13.167 14.8123 13.1045 14.8299 13.0516C14.8454 13.0048 14.8731 12.9615 14.9099 12.9248C14.9507 12.884 15.0193 12.8546 15.1565 12.7959L20.913 9.91932C21.2347 9.76839 21.3956 9.69293 21.4891 9.58129C21.5707 9.48229 21.6173 9.36153 21.622 9.2357C21.6273 9.09403 21.5471 8.94398 21.3868 8.64388L21.9347 10.0064ZM21.9347 10.0064C22.0219 10.1877 22.0604 10.298 22.0205 10.4103M21.9347 10.0064L22.0205 10.4103M22.0205 10.4103C21.9878 10.5015 21.9049 10.5908 21.7392 10.7693L16.7821 16.11C16.4867 16.4314 16.339 16.5921 16.1693 16.6912C16.0184 16.7797 15.8517 16.8386 15.6784 16.865C15.4841 16.8947 15.2802 16.8506 14.8724 16.7625L14.8123 16.749V16.749L14.7516 16.7357C14.3606 16.65 14.1651 16.6072 14.0094 16.5001C13.8702 16.4047 13.7548 16.2739 13.6732 16.1248C13.5816 15.9574 13.559 15.7577 13.5137 15.3583V15.3583L13.5067 15.3044C13.4249 14.5286 13.3839 14.1408 13.2229 13.8098C13.0786 13.5106 12.8608 13.2526 12.5907 13.0622C12.2896 12.8501 11.9029 12.7624 11.1296 12.587L11.1296 12.587L11.0709 12.5741C9.12378 12.1435 8.15019 11.9282 7.7599 11.3587L9.02743 17.7494M22.0205 10.4103C22.0866 10.2807 22.0429 10.1531 22.0172 10.0873L9.02743 17.7494" fill="currentColor"/>
                        </svg>
                        Supabase Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingSingle ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                          <span>Loading...</span>
                        </div>
                      ) : !singleRowData ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No data selected
                        </div>
                      ) : registrationStatus === 'no_mentor_id' ? (
                        <div className="p-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-amber-500 mb-2 animate-spin" />
                            <p className="text-amber-700 font-medium">Registration in Progress</p>
                            <p className="text-amber-600 text-sm text-center mt-1">
                              This record does not have a Mentor_ID yet. The user registration is still being processed.
                            </p>
                          </div>
                        </div>
                      ) : registrationStatus === 'no_supabase_match' ? (
                        <div className="p-4">
                          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex flex-col items-center">
                            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                            <p className="text-red-700 font-medium">No Supabase Match</p>
                            <p className="text-red-600 text-sm text-center mt-1">
                              Mentor_ID <code>{singleRowData[idField]}</code> exists but no corresponding user found in Supabase.
                            </p>
                          </div>
                        </div>
                      ) : !supabaseUserData ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No Supabase data found
                        </div>
                      ) : (
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            User ID: <code>{supabaseUserData.user_id}</code>
                          </p>
                          
                          <div className="overflow-auto max-h-[300px]">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2 font-medium">Field</th>
                                  <th className="text-left p-2 font-medium">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(supabaseUserData).map(([key, value]) => (
                                  <tr key={key} className="border-b">
                                    <td className="p-2 font-mono text-xs">{key}</td>
                                    <td className="p-2">
                                      {value === null || value === undefined || value === '' 
                                        ? <span className="text-muted-foreground italic">empty</span>
                                        : String(value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between text-xs text-muted-foreground">
          <div>
            Using table: <code>{tableName}</code>
            {viewName && viewName !== '__no_view__' && <>, view: <code>{viewName}</code></>}
            , ID field: <code>{idField}</code>
          </div>
          <div>
            {mentors.length > 0 && (
              <span>
                View: {mentors.length} records, Full table: {fullTableData.length} records at {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};