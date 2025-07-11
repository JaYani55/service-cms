import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, AlertCircle, Check, Key, Database, Table, 
  ListFilter, RotateCcw, ArrowDownToLine 
} from 'lucide-react';
import {  
  SeaTableTableMetadata, 
  SeaTableMetadata,
  SeaTableRow
} from '@/types/seaTableTypes';
import { seatableClient } from '@/lib/seatableClient'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export const SeaTableDebugger = () => {
  const { toast } = useToast();
  const [apiToken, setApiToken] = useState<string>(import.meta.env.VITE_SEATABLE_API_KEY || '');
  const [baseToken, setBaseToken] = useState<string>('');
  const [baseUuid, setBaseUuid] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [baseTokenExpiry, setBaseTokenExpiry] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SeaTableMetadata | null>(null);
  const [tableList, setTableList] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<SeaTableRow[] | null>(null);
  const [tableStructure, setTableStructure] = useState<SeaTableTableMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'api_token' | 'base_token' | 'metadata'>('api_token');

  // Initialize data on component mount
  useEffect(() => {
    checkToken();
  }, []);
  
  // Check if we have a valid token
  const checkToken = async () => {
    try {
      const tokenInfo = seatableClient.getTokenInfo();
      
      if (tokenInfo.hasToken) {
        try {
          // Get current auth data
          const { axiosInstance, baseUuid, serverUrl } = await seatableClient.getAxiosInstance();
          
          // Use a placeholder since we can't access the actual token
          setBaseToken("***** Token Available (Hidden) *****");
          setBaseUuid(baseUuid);
          setServerUrl(serverUrl);
          setBaseTokenExpiry(tokenInfo.expires);
          setAuthStep('base_token');
          
          // Try to fetch metadata
          await fetchMetadata();
        } catch (err) {
          // Error initializing with stored token
        }
      }
    } catch (err) {
      // Error checking token
    }
  };

  // Step 1: Generate Base Token using API Token
  const generateBaseToken = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get both the axios instance and token info
      const { axiosInstance, baseUuid, serverUrl } = await seatableClient.getAxiosInstance();
      const tokenInfo = seatableClient.getTokenInfo();
      
      // Use a placeholder since we can't access the actual token
      setBaseToken("***** Token Available (Hidden) *****");
      setBaseUuid(baseUuid);
      setServerUrl(serverUrl);
      
      // Calculate and format expiry date
      setBaseTokenExpiry(tokenInfo.expires);
      
      // Move to next step
      setAuthStep('base_token');
      
      toast({
        title: "Base Token Generated",
        description: "Successfully generated a new base token",
      });
    } catch (err: any) {
      setError(`Error generating Base Token: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Get Metadata using Base Token
  const fetchMetadata = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const metadataResult = await seatableClient.getMetadata(forceRefresh);
      setMetadata(metadataResult);
      setAuthStep('metadata');
      
      // Extract table list
      if (metadataResult?.metadata?.tables) {
        const tables = metadataResult.metadata.tables.map(table => table.name);
        setTableList(tables);
        
        // If we have tables and none is selected, select the first one
        if (tables.length > 0 && !selectedTable) {
          setSelectedTable(tables[0]);
          await fetchTableStructure(tables[0]);
        }
      }
      
      toast({
        title: "Metadata Loaded",
        description: `Found ${metadataResult?.metadata?.tables?.length || 0} tables`,
      });
    } catch (err: any) {
      setError(`Error fetching metadata: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch structure for a specific table
  const fetchTableStructure = async (tableName: string) => {
    setIsLoading(true);
    setTableData(null);
    
    try {
      const structure = await seatableClient.getTableStructure(tableName);
      setTableStructure(structure);
      
      // Also fetch some data for this table
      if (structure) {
        await fetchTableData(tableName);
      }
    } catch (err: any) {
      setError(`Error fetching table structure: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data for a specific table
  const fetchTableData = async (tableName: string) => {
    try {
      const rows = await seatableClient.getTableRows(tableName);
      setTableData(rows);
      
      toast({
        title: `Table Data Loaded`,
        description: `Loaded ${rows.length} rows from ${tableName}`,
      });
    } catch (err: any) {
      setError(`Error fetching table data: ${err.message || 'Unknown error'}`);
    }
  };
  
  // Handle table selection
  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    await fetchTableStructure(tableName);
  };
  
  // Download table data as JSON
  const downloadTableDataAsJson = () => {
    if (!tableData || !selectedTable) return;
    
    const dataStr = JSON.stringify(tableData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: `Downloaded ${tableData.length} rows as JSON`,
    });
  };

  // Add this new test function in your component
  const testAllEndpoints = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await seatableClient.testEndpoints();
      console.log('Endpoint test results:', results);
      
      // Ensure results is always an array
      const resultsArray = Array.isArray(results) ? results : [results];
      
      toast({
        title: "Endpoint Test Complete",
        description: `Tested ${resultsArray.length} endpoints. Check console for details.`,
      });
      
      // Format the results for display
      const formattedResults = resultsArray.map((result, index) => {
        if ('error' in result) {
          return `Endpoint ${index + 1}: ❌ Error - ${result.error}`;
        } else if ('success' in result) {
          return `Endpoint ${index + 1}: ${result.success ? '✅' : '❌'} ${result.message || 'No message'}`;
        } else {
          return `Endpoint ${index + 1}: ${JSON.stringify(result)}`;
        }
      }).join('\n');
      
      // Update the error state to show results (using error state for display)
      setError(`Endpoint Test Results:\n${formattedResults}`);
      
    } catch (err: any) {
      setError(`Endpoint test failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this new function to your SeaTableDebugger component
  const testSpecificUuid = async () => {
    setIsLoading(true);
    setError(null);
    
    const testUuid = 'd5e5c7a9-1cc6-4c4b-9dde-377002cc909d';
    
    try {
      // Test if seatableClient has the testSpecificUuid method
      if ('testSpecificUuid' in seatableClient && typeof seatableClient.testSpecificUuid === 'function') {
        const results = await seatableClient.testSpecificUuid(testUuid);
        console.log('UUID test results:', results);
        
        toast({
          title: results.directFound ? "UUID Found!" : "UUID Not Found",
          description: results.directFound 
            ? `Found mentor data for UUID: ${testUuid}` 
            : `UUID ${testUuid} was not found in the table`,
          variant: results.directFound ? "default" : "destructive"
        });
        
        // Format results for display
        const resultText = `UUID Test Results for: ${testUuid}
  Direct Search: ${results.directFound ? '✅ FOUND' : '❌ NOT FOUND'}
  In Mentor_ID List: ${results.inMentorIdList ? '✅ YES' : '❌ NO'}
  Found in Any Column: ${results.foundInAnyColumn ? '✅ YES' : '❌ NO'}
  Total Mentors: ${results.totalMentors}
  Total Valid IDs: ${results.totalValidIds}
  Sample IDs: ${results.sampleIds?.join(', ') || 'None'}`;
        
        setError(resultText);
        
      } else {
        // Fallback: direct test
        const result = await seatableClient.getMentorById(testUuid);
        
        if (result) {
          toast({
            title: "UUID Found!",
            description: `Found: ${result.Vorname} ${result.Nachname}`,
          });
          setError(`✅ UUID Found: ${result.Vorname} ${result.Nachname}\nEmail: ${result['E-Mail-Adresse']}`);
        } else {
          toast({
            title: "UUID Not Found",
            description: "The UUID was not found in the SeaTable data",
            variant: "destructive"
          });
          setError(`❌ UUID ${testUuid} not found in SeaTable data`);
        }
      }
      
    } catch (err: any) {
      setError(`UUID test failed: ${err.message}`);
      toast({
        title: "Test Error",
        description: `Error: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card className="p-6 shadow-md">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="h-6 w-6" />
            SeaTable API Explorer
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Dynamic Data Explorer</AlertTitle>
            <AlertDescription className="text-blue-700">
              This tool helps you explore your SeaTable schema and data. It dynamically discovers
              tables, columns, and relationships to help integrate with your application.
            </AlertDescription>
          </Alert>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <p className="font-semibold">Error:</p>
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="auth" className="flex items-center gap-1">
                <Key className="h-4 w-4" /> Authentication
              </TabsTrigger>
              <TabsTrigger value="explorer" className="flex items-center gap-1" disabled={!metadata}>
                <Table className="h-4 w-4" /> Table Explorer
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center gap-1" disabled={!metadata}>
                <Database className="h-4 w-4" /> Raw Metadata
              </TabsTrigger>
            </TabsList>
            
            {/* Authentication Tab */}
            <TabsContent value="auth">
              <div className="space-y-6">
                {/* Step 1: API Token */}
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Key className="h-5 w-5 text-amber-500" />
                    <span>Step 1: API Token</span>
                    {apiToken && <Check className="h-5 w-5 text-green-500 ml-2" />}
                  </h3>
                  
                  <p className="mb-4 text-sm text-muted-foreground">
                    API Token loaded from environment variables (VITE_SEATABLE_API_KEY)
                  </p>
                  
                  <div className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                    <code className="text-xs">{apiToken ? apiToken.substring(0, 10) + '...' + apiToken.substring(apiToken.length - 5) : 'Not available'}</code>
                  </div>
                </div>
                
                {/* Step 2: Base Token */}
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Key className="h-5 w-5 text-blue-500" />
                    <span>Step 2: Generate Base Token</span>
                    {baseToken && <Check className="h-5 w-5 text-green-500 ml-2" />}
                  </h3>
                  
                  <div className="mb-4">
                    <Button 
                      onClick={generateBaseToken} 
                      disabled={isLoading || !apiToken}
                      className="mb-2"
                    >
                      {isLoading && authStep === 'api_token' ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                      ) : baseToken ? 'Regenerate Base Token' : 'Generate Base Token'}
                    </Button>
                    
                    {baseTokenExpiry && (
                      <p className="text-xs text-muted-foreground">
                        Token expires: {baseTokenExpiry}
                      </p>
                    )}
                  </div>
                  
                  {baseToken && (
                    <>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Base Token:</p>
                          <div className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                            <code className="text-xs">{baseToken.substring(0, 15) + '...'}</code>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Base UUID:</p>
                          <div className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                            <code className="text-xs">{baseUuid}</code>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Server URL:</p>
                          <div className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                            <code className="text-xs">{serverUrl}</code>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Step 3: Get Metadata */}
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                    <Database className="h-5 w-5 text-green-500" />
                    <span>Step 3: Get Base Metadata</span>
                    {metadata && <Check className="h-5 w-5 text-green-500 ml-2" />}
                  </h3>
                  
                  <Button 
                    onClick={() => fetchMetadata(true)} 
                    disabled={isLoading || !baseToken}
                    className="mb-4"
                  >
                    {isLoading && authStep === 'base_token' ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                    ) : metadata ? 'Refresh Metadata' : 'Get Metadata'}
                  </Button>
                  
                  {metadata && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Metadata loaded successfully! Found {metadata?.metadata?.tables?.length || 0} tables.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Test All API Endpoints Button */}
                <Button 
                  onClick={testAllEndpoints} 
                  disabled={isLoading || !baseToken}
                  variant="outline"
                  className="mb-2"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
                  ) : 'Test All API Endpoints'}
                </Button>

                {/* Add this after the "Test All API Endpoints" button */}
                <Button 
                  onClick={testSpecificUuid} 
                  disabled={isLoading || !baseToken}
                  variant="outline"
                  className="mb-2 ml-2"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing UUID...</>
                  ) : 'Test Specific UUID'}
                </Button>
              </div>
            </TabsContent>
            
            {/* Table Explorer Tab */}
            <TabsContent value="explorer">
              <div className="border rounded-md p-4 mb-4">
                <h3 className="text-lg font-medium mb-4">Select a Table to Explore</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Select value={selectedTable} onValueChange={handleTableSelect}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableList.map((tableName) => (
                        <SelectItem key={tableName} value={tableName}>{tableName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm" onClick={() => fetchTableStructure(selectedTable)}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>
              
              {selectedTable && tableStructure && (
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Table className="h-5 w-5" />
                        Table: {tableStructure.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-6">
                        <h4 className="text-md font-medium mb-2">Table Structure</h4>
                        <div className="bg-gray-50 rounded-md p-4 overflow-auto max-h-[400px]">
                          <table className="min-w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-2 py-1 text-left">Field Name</th>
                                <th className="border px-2 py-1 text-left">Type</th>
                                <th className="border px-2 py-1 text-left">Key</th>
                                <th className="border px-2 py-1 text-left">Editable</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableStructure.columns.map((column, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border px-2 py-1">{column.name}</td>
                                  <td className="border px-2 py-1">{column.type}</td>
                                  <td className="border px-2 py-1">{column.key}</td>
                                  <td className="border px-2 py-1">{column.editable ? 'Yes' : 'No'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {tableData && tableData.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-md font-medium">
                              Sample Data ({tableData.length} rows)
                            </h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={downloadTableDataAsJson}
                            >
                              <ArrowDownToLine className="h-4 w-4 mr-1" /> Download JSON
                            </Button>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-4 overflow-auto max-h-[400px]">
                            <Accordion type="single" collapsible className="w-full">
                              {tableData.slice(0, 10).map((row, rowIndex) => (
                                <AccordionItem key={rowIndex} value={`item-${rowIndex}`}>
                                  <AccordionTrigger>
                                    Row {rowIndex + 1}
                                    {row._id && <span className="text-xs text-muted-foreground ml-2">ID: {row._id}</span>}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded">
                                      {JSON.stringify(row, null, 2)}
                                    </pre>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                            
                            {tableData.length > 10 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Showing first 10 of {tableData.length} rows. Download JSON to see all data.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {tableData && tableData.length === 0 && (
                        <div className="text-center p-4 border border-dashed rounded-md">
                          <p className="text-muted-foreground">No data found in this table.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
            
            {/* Raw Metadata Tab */}
            <TabsContent value="metadata">
              {metadata && (
                <div className="border p-4 rounded-md overflow-auto max-h-[600px]">
                  <h3 className="text-lg font-medium mb-2">Full Metadata Structure</h3>
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};