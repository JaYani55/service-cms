import axios from 'axios';
import { 
  SeaTableRow, 
  SeaTableColumn, 
  SeaTableTableMetadata,
  SeaTableMetadata,
  MentorMappingOptions
} from '@/types/seaTableTypes';

export interface SeaTableBaseTokenResponse {
  access_token: string;
  dtable_uuid: string;
  dtable_server: string;
  dtable_socket?: string;
  dtable_db?: string;
  workspace_id?: number;
  dtable_name?: string;
  app_name?: string;
}

// Add this helper function OUTSIDE the class, before the SimpleSeaTableClient class definition
function mapOptionValues(value: any, column: SeaTableColumn): any {
  if (!value || !column.data?.options) {
    return value;
  }

  // Handle single select
  if (column.type === 'single-select' && typeof value === 'string') {
    const option = column.data.options.find((opt: any) => opt.id === value);
    return option ? option.name : value;
  }

  // Handle multiple select
  if (column.type === 'multiple-select') {
    if (Array.isArray(value)) {
      return value.map(id => {
        const option = column.data.options.find((opt: any) => opt.id === id);
        return option ? option.name : id;
      });
    }
    // Sometimes multi-select comes as comma-separated string
    if (typeof value === 'string' && value.includes(',')) {
      const ids = value.split(',').map(id => id.trim());
      return ids.map(id => {
        const option = column.data.options.find((opt: any) => opt.id === id);
        return option ? option.name : id;
      });
    }
    // Single ID as string
    if (typeof value === 'string') {
      const option = column.data.options.find((opt: any) => opt.id === value);
      return option ? [option.name] : [value];
    }
  }

  // Handle collaborator fields
  if (column.type === 'collaborator' && Array.isArray(value)) {
    return value.map(collab => collab.name || collab.email || collab);
  }

  return value;
}

// Simple SeaTable client following the exact guide
class SimpleSeaTableClient {
  private apiToken: string;
  private baseToken: string | null = null;
  private dtableUuid: string | null = null;
  private dtableServer: string | null = null;
  private tokenExpiry: Date | null = null;
  private metadata: SeaTableMetadata | null = null;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.loadCachedToken();
  }

  // Load cached token if valid
  private loadCachedToken() {
    try {
      const storedToken = localStorage.getItem('seatable_access_token');
      const storedUuid = localStorage.getItem('seatable_dtable_uuid');
      const storedServer = localStorage.getItem('seatable_dtable_server');
      const storedExpiry = localStorage.getItem('seatable_token_expiry');

      if (storedToken && storedUuid && storedServer && storedExpiry) {
        const expiry = new Date(storedExpiry);
        if (expiry > new Date()) {
          this.baseToken = storedToken;
          this.dtableUuid = storedUuid;
          this.dtableServer = storedServer; // Use exactly what was stored - don't modify
          this.tokenExpiry = expiry;
          
          console.log('[SeaTable] Using cached token, expires:', expiry.toLocaleString());
          console.log('[SeaTable] Cached server URL:', this.dtableServer);
        } else {
          this.clearCache();
        }
      }
    } catch (err) {
      console.warn('[SeaTable] Error loading cached token:', err);
      this.clearCache();
    }
  }

  // Clear all cached data
  private clearCache() {
    localStorage.removeItem('seatable_access_token');
    localStorage.removeItem('seatable_dtable_uuid');
    localStorage.removeItem('seatable_dtable_server');
    localStorage.removeItem('seatable_token_expiry');
    localStorage.removeItem('seatable_metadata');
    this.baseToken = null;
    this.dtableUuid = null;
    this.dtableServer = null;
    this.tokenExpiry = null;
    this.metadata = null;
  }

  // Step 1: Get access token using API token (following the exact guide)
  private async getAccessToken(): Promise<SeaTableBaseTokenResponse> {
    try {
      console.log('[SeaTable] Getting access token with API token...');
      
      // Make sure we have an API token
      if (!this.apiToken) {
        throw new Error('API token is missing');
      }
      
      const response = await axios.get('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('[SeaTable] Access token response:', response.status);
      console.log('[SeaTable] Response data:', response.data);
      
      if (!response.data?.access_token) {
        console.error('[SeaTable] Invalid response:', response.data);
        throw new Error('No access token in response');
      }

      // Store the response data EXACTLY as returned - don't modify URLs
      this.baseToken = response.data.access_token;
      this.dtableUuid = response.data.dtable_uuid;
      this.dtableServer = response.data.dtable_server;

      // Validate required fields
      if (!this.dtableUuid || !this.dtableServer) {
        throw new Error('Missing required fields in token response');
      }

      // Calculate expiry (3 days from now)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setDate(this.tokenExpiry.getDate() + 3);

      // Cache the data
      localStorage.setItem('seatable_access_token', this.baseToken);
      localStorage.setItem('seatable_dtable_uuid', this.dtableUuid);
      localStorage.setItem('seatable_dtable_server', this.dtableServer);
      localStorage.setItem('seatable_token_expiry', this.tokenExpiry.toISOString());

      console.log('[SeaTable] Token data stored successfully');
      console.log('- dtable_server:', this.dtableServer);
      console.log('- dtable_uuid:', this.dtableUuid);
      console.log('- expires:', this.tokenExpiry.toLocaleString());

      return response.data;
    } catch (err: any) {
      console.error('[SeaTable] Error getting access token:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      this.clearCache();
      
      if (err.response?.status === 401) {
        throw new Error('Invalid API token - please check your VITE_SEATABLE_API_KEY');
      } else if (err.response?.status === 403) {
        throw new Error('API token does not have permission to access this base');
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to SeaTable servers - check your internet connection');
      }
      
      throw new Error(`Failed to get access token: ${err.response?.data?.detail || err.message}`);
    }
  }

  // Ensure we have a valid token
  public async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    if (!this.baseToken || !this.dtableUuid || !this.dtableServer || !this.tokenExpiry || now >= this.tokenExpiry) {
      console.log('[SeaTable] Need to refresh token...');
      await this.getAccessToken();
    }
  }

  // Step 2: Fetch table rows - UPDATED FOR API-GATEWAY
  async getTableRows(tableName: string, viewName?: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      console.log('[SeaTable] Fetching rows from table:', tableName, viewName ? `(view: ${viewName})` : '');
      
      // Use the NEW v2 API gateway rows endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/rows/`;
      
      const params: any = {
        table_name: tableName
      };
      
      if (viewName) {
        params.view_name = viewName;
      }
      
      console.log('[SeaTable] Request URL:', url);
      console.log('[SeaTable] Request params:', params);
      
      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Accept': 'application/json'
        }
      });
      
      let rows = [];
      if (response.data?.rows) {
        rows = response.data.rows;
      } else if (Array.isArray(response.data)) {
        rows = response.data;
      }
      
      console.log('[SeaTable] Successfully fetched rows:', rows.length);
      return rows;
      
    } catch (err: any) {
      console.error('[SeaTable] Error fetching table rows:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      throw err;
    }
  }

  // Fix the getFilteredRows method with better debugging
  async getFilteredRows(tableName: string, filterColumn: string, filterValue: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway SQL endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/sql/`;
      
      const requestData = {
        sql: `SELECT * FROM \`${tableName}\` WHERE \`${filterColumn}\` = '${filterValue}'`
      };
      
      console.log('[SeaTable] SQL Query:', requestData.sql);
      console.log('[SeaTable] Looking for:', { filterColumn, filterValue });
      
      const response = await axios.post(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const results = response.data.results || [];
      console.log('[SeaTable] SQL Query successful, results:', results.length);
      
      // DEBUG: If no results, let's see what columns are available
      if (results.length === 0) {
        console.log('[SeaTable] No results found. Let\'s check what data exists...');
        
        // Try to get just a few rows to see the structure
        const debugSql = `SELECT * FROM \`${tableName}\` LIMIT 5`;
        console.log('[SeaTable] Debug SQL:', debugSql);
        
        try {
          const debugResponse = await axios.post(url, { sql: debugSql }, {
            headers: {
              'Authorization': `Bearer ${this.baseToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          const debugResults = debugResponse.data.results || [];
          console.log('[SeaTable] Sample rows:', debugResults);
          
          if (debugResults.length > 0) {
            console.log('[SeaTable] Available columns:', Object.keys(debugResults[0]));
            console.log('[SeaTable] First row data:', debugResults[0]);
          }
        } catch (debugErr) {
          console.error('[SeaTable] Debug query failed:', debugErr);
        }
      }
      
      return results;
      
    } catch (err: any) {
      console.log('[SeaTable] SQL query failed, trying fallback...');
      console.error('[SeaTable] SQL Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      // Fallback: Get all rows and filter locally
      try {
        const allRows = await this.getTableRows(tableName);
        console.log('[SeaTable] Fallback: Got', allRows.length, 'total rows');
        
        if (allRows.length > 0) {
          console.log('[SeaTable] Fallback: Sample row columns:', Object.keys(allRows[0]));
          console.log('[SeaTable] Fallback: Looking for', filterColumn, '=', filterValue);
          
          // Check if the column exists
          const hasColumn = Object.keys(allRows[0]).includes(filterColumn);
          console.log('[SeaTable] Fallback: Column', filterColumn, 'exists:', hasColumn);
          
          if (!hasColumn) {
            console.log('[SeaTable] Fallback: Available columns:', Object.keys(allRows[0]));
          }
        }
        
        const filtered = allRows.filter(row => row[filterColumn] === filterValue);
        console.log('[SeaTable] Local filtering successful, filtered rows:', filtered.length);
        return filtered;
      } catch (fallbackErr) {
        console.error('[SeaTable] Both SQL and local filtering failed');
        return [];
      }
    }
  }

  // Update the getTableRowsWithMapping method to include option value mapping
  async getTableRowsWithMapping(tableName: string, viewName?: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      console.log('[SeaTable] Fetching rows with mapping from table:', tableName, viewName ? `(view: ${viewName})` : '');
      
      // First get the raw data
      const rawRows = await this.getTableRows(tableName, viewName);
      
      // Get the table structure for mapping
      const tableStructure = await this.getTableStructure(tableName);
      if (!tableStructure) {
        console.warn('[SeaTable] No table structure found, returning raw data');
        return rawRows;
      }
      
      // Map the results to use column names instead of keys AND map option values
      const mappedRows = rawRows.map(row => {
        const mappedRow: any = {};
        
        // Map each column key to its name and convert option IDs to display values
        tableStructure.columns.forEach(column => {
          if (row.hasOwnProperty(column.key)) {
            const rawValue = row[column.key];
            // Map option IDs to display values
            const mappedValue = mapOptionValues(rawValue, column);
            mappedRow[column.name] = mappedValue;
          }
        });
        
        // Keep the special system fields
        ['_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived'].forEach(field => {
          if (row.hasOwnProperty(field)) {
            mappedRow[field] = row[field];
          }
        });
        
        return mappedRow;
      });
      
      console.log('[SeaTable] Successfully mapped rows with option values:', mappedRows.length);
      return mappedRows;
      
    } catch (err: any) {
      console.error('[SeaTable] Error fetching table rows with mapping:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      throw err;
    }
  }

  // Also update the getFilteredRowsWithMapping method
  async getFilteredRowsWithMapping(tableName: string, filterColumn: string, filterValue: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      // First, get the table structure to map column names to keys
      const tableStructure = await this.getTableStructure(tableName);
      if (!tableStructure) {
        throw new Error(`Table ${tableName} not found`);
      }
      
      // Find the column key for the given column name
      const columnMapping = tableStructure.columns.find(col => col.name === filterColumn);
      if (!columnMapping) {
        console.error(`[SeaTable] Column '${filterColumn}' not found in table '${tableName}'`);
        console.log('[SeaTable] Available columns:', tableStructure.columns.map(c => c.name));
        throw new Error(`Column '${filterColumn}' not found`);
      }
      
      const columnKey = columnMapping.key;
      console.log(`[SeaTable] Mapped column '${filterColumn}' to key '${columnKey}'`);
      
      // Use the NEW v2 API gateway SQL endpoint with the column KEY
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/sql/`;
      
      const requestData = {
        sql: `SELECT * FROM \`${tableName}\` WHERE \`${columnKey}\` = '${filterValue}'`
      };
      
      console.log('[SeaTable] SQL Query with mapped column:', requestData.sql);
      console.log('[SeaTable] Looking for:', { filterColumn, columnKey, filterValue });
      
      const response = await axios.post(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const results = response.data.results || [];
      console.log('[SeaTable] SQL Query successful, results:', results.length);
      
      // Map the results back to use column names instead of keys AND map option values
      const mappedResults = results.map(row => {
        const mappedRow: any = {};
        
        // Map each column key back to its name and convert option IDs to display values
        tableStructure.columns.forEach(column => {
          if (row.hasOwnProperty(column.key)) {
            const rawValue = row[column.key];
            // Map option IDs to display values
            const mappedValue = mapOptionValues(rawValue, column);
            mappedRow[column.name] = mappedValue;
          }
        });
        
        // Keep the special system fields
        ['_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived'].forEach(field => {
          if (row.hasOwnProperty(field)) {
            mappedRow[field] = row[field];
          }
        });
        
        return mappedRow;
      });
      
      console.log('[SeaTable] Mapped results with option values:', mappedResults.length);
      return mappedResults;
      
    } catch (err: any) {
      console.log('[SeaTable] SQL query with mapping failed, trying fallback...');
      console.error('[SeaTable] SQL Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      // Fallback: Get all rows with mapping and filter locally
      try {
        const allRows = await this.getTableRowsWithMapping(tableName);
        console.log('[SeaTable] Fallback: Got', allRows.length, 'total rows with mapping');
        
        if (allRows.length > 0) {
          console.log('[SeaTable] Fallback: Sample row columns:', Object.keys(allRows[0]));
          console.log('[SeaTable] Fallback: Looking for', filterColumn, '=', filterValue);
          
          // Check if the column exists
          const hasColumn = Object.keys(allRows[0]).includes(filterColumn);
          console.log('[SeaTable] Fallback: Column', filterColumn, 'exists:', hasColumn);
          
          if (!hasColumn) {
            console.log('[SeaTable] Fallback: Available columns:', Object.keys(allRows[0]));
          }
        }
        
        const filtered = allRows.filter(row => row[filterColumn] === filterValue);
        console.log('[SeaTable] Local filtering successful, filtered rows:', filtered.length);
        return filtered;
      } catch (fallbackErr) {
        console.error('[SeaTable] Both SQL and local filtering failed');
        return [];
      }
    }
  }

  // Step 3: Get metadata - UPDATED FOR NEW API-GATEWAY ENDPOINTS
  async getMetadata(forceRefresh = false): Promise<SeaTableMetadata> {
    if (this.metadata && !forceRefresh) {
      return this.metadata;
    }

    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway metadata endpoint
      const metadataUrl = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/metadata/`;
      
      console.log('[SeaTable] Fetching metadata from:', metadataUrl);
      
      const response = await axios.get(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Accept': 'application/json'
        }
      });

      console.log('[SeaTable] Metadata response status:', response.status);
      
      if (response.data?.metadata) {
        this.metadata = response.data;
      } else {
        // Handle direct metadata format
        this.metadata = {
          metadata: response.data
        };
      }
      
      // Cache metadata
      localStorage.setItem('seatable_metadata', JSON.stringify(this.metadata));
      
      console.log('[SeaTable] Metadata loaded successfully');
      console.log('- Tables:', this.metadata.metadata?.tables?.length || 0);
      
      return this.metadata;
      
    } catch (err: any) {
      console.error('[SeaTable] Error fetching metadata:', err);
      throw new Error(`Failed to fetch metadata: ${err.message}`);
    }
  }

  // Update a row - UPDATED FOR API-GATEWAY
  async updateRow(tableName: string, rowId: string, data: Record<string, any>): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway update endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/rows/`;
      
      const requestData = {
        table_name: tableName,
        row_id: rowId,
        row: data
      };
      
      console.log('[SeaTable] Updating row:', requestData);
      
      const response = await axios.put(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('[SeaTable] Update successful');
        return true;
      }
      
      return false;
      
    } catch (err: any) {
      console.error('[SeaTable] Error updating row:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      return false;
    }
  }

  // Get table structure
  async getTableStructure(tableName: string): Promise<SeaTableTableMetadata | null> {
    try {
      const metadata = await this.getMetadata();
      return metadata.metadata.tables?.find(t => t.name === tableName) || null;
    } catch (err) {
      console.error(`[SeaTable] Error getting table structure for ${tableName}:`, err);
      return null;
    }
  }
  // List tables - use metadata endpoint as primary method
  async listTables(): Promise<string[]> {
    try {
      console.log('[SeaTable] Listing tables from metadata...');
      const metadata = await this.getMetadata();
      const tables = metadata.metadata.tables?.map(t => t.name) || [];
      console.log('[SeaTable] Found tables:', tables);
      return tables;
    } catch (err) {
      console.error('[SeaTable] Error listing tables from metadata:', err);
      return [];
    }
  }

  // Debug info
  getTokenInfo() {
    return {
      hasToken: !!this.baseToken,
      expires: this.tokenExpiry ? this.tokenExpiry.toLocaleString() : 'Not set',
      baseUuid: this.dtableUuid || 'Not set',
      serverUrl: this.dtableServer || 'Not set',
      hasCachedMetadata: !!this.metadata
    };
  }

  // Test connection
  async debugConnection() {
    try {
      console.log('[SeaTable Debug] Testing connection...');
      
      // Test token generation
      await this.getAccessToken();
      console.log('[SeaTable Debug] ✅ Token generation successful');
      
      // Test metadata fetch
      const metadata = await this.getMetadata(true);
      console.log('[SeaTable Debug] ✅ Metadata fetch successful');
      console.log('[SeaTable Debug] Tables found:', metadata.metadata.tables?.length || 0);
      
      // Test table rows fetch
      if (metadata.metadata.tables?.length > 0) {
        const firstTable = metadata.metadata.tables[0].name;
        const rows = await this.getTableRows(firstTable);
        console.log('[SeaTable Debug] ✅ Table rows fetch successful');
        console.log('[SeaTable Debug] Rows in first table:', rows.length);
      }
      
      return { success: true, message: 'All tests passed' };
    } catch (error: any) {
      console.error('[SeaTable Debug] ❌ Connection test failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Add this method to your SimpleSeaTableClient class
  async testApiToken(): Promise<boolean> {
    try {
      console.log('[SeaTable] Testing API token...');
      console.log('[SeaTable] API token length:', this.apiToken.length);
      console.log('[SeaTable] API token first 10 chars:', this.apiToken.substring(0, 10));
      
      const response = await axios.get('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('[SeaTable] API token test successful:', response.status);
      console.log('[SeaTable] Response:', response.data);
      return true;
    } catch (err: any) {
      console.error('[SeaTable] API token test failed:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      return false;
    }
  }
}

// Create client instance
const SEATABLE_API_KEY = import.meta.env.VITE_SEATABLE_API_KEY || '';

if (!SEATABLE_API_KEY) {
  console.error('[SeaTable] VITE_SEATABLE_API_KEY environment variable is not set');
}

const simpleClient = new SimpleSeaTableClient(SEATABLE_API_KEY);

// Export a compatible interface
export const seatableClient = {
  // Core methods - UPDATE these to use mapping
  getTableRows: (tableName: string, viewName?: string, forceRefresh = false) => 
    simpleClient.getTableRowsWithMapping(tableName, viewName),
  
  getTableRowsByView: (tableName: string, viewName: string, forceRefresh = false) => 
    simpleClient.getTableRowsWithMapping(tableName, viewName),
  
  getFilteredRows: (tableName: string, filterColumn: string, filterValue: string) => 
    simpleClient.getFilteredRowsWithMapping(tableName, filterColumn, filterValue),
  
  // Keep existing methods unchanged
  getMetadata: (forceRefresh = false) => 
    simpleClient.getMetadata(forceRefresh),
  
  getTableStructure: (tableName: string) => 
    simpleClient.getTableStructure(tableName),
  
  listTables: () => 
    simpleClient.listTables(),
  
  updateRow: (tableName: string, rowId: string, data: Record<string, any>) => 
    simpleClient.updateRow(tableName, rowId, data),

  // Update convenience methods to use new mapping
  getMentorById: async (mentorId: string, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error(`[SeaTable] Error getting mentor by ID ${mentorId}:`, err);
      return null;
    }
  },

  updateMentorField: async (mentorId: string, field: string, value: any, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      if (rows.length === 0) {
        throw new Error(`Mentor with ID ${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      return await simpleClient.updateRow(tableName, rowId, { [field]: value });
    } catch (err) {
      console.error(`[SeaTable] Error updating mentor field ${field}:`, err);
      return false;
    }
  },

  updateMentor: async (mentorId: string, data: Record<string, any>, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      if (rows.length === 0) {
        throw new Error(`Mentor with ID ${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      return await simpleClient.updateRow(tableName, rowId, data);
    } catch (err) {
      console.error(`[SeaTable] Error updating mentor:`, err);
      return false;
    }
  },

  // Legacy compatibility methods
  getAxiosInstance: async (forceRefresh = false) => {
    await simpleClient.ensureValidToken();
    return {
      axiosInstance: axios.create({
        headers: {
          'Authorization': `Token ${simpleClient['baseToken']}`,
          'Content-Type': 'application/json'
        }
      }),
      baseUuid: simpleClient['dtableUuid'],
      serverUrl: simpleClient['dtableServer']
    };
  },

  getTokenInfo: () => simpleClient.getTokenInfo(),
  
  debugConnection: () => simpleClient.debugConnection(),

  // Additional methods for compatibility
  detectMentorTable: async () => {
    try {
      const tables = await simpleClient.listTables();
      const preferredTableOrder = ['Neue_MentorInnen', 'Mentors'];
      
      for (const tableName of preferredTableOrder) {
        if (tables.includes(tableName)) {
          const structure = await simpleClient.getTableStructure(tableName);
          if (structure && structure.columns.some(col => col.name === 'Mentor_ID')) {
            return tableName;
          }
        }
      }
      
      return 'Neue_MentorInnen';
    } catch (err) {
      console.error('[SeaTable] Error detecting mentor table:', err);
      return 'Neue_MentorInnen';
    }
  },

  canMapMentorFields: async (tableName: string, mappingOptions?: MentorMappingOptions) => {
    try {
      const structure = await simpleClient.getTableStructure(tableName);
      if (!structure) return false;
      
      const columnNames = structure.columns.map(c => c.name);
      const idFields = [mappingOptions?.idField, 'Mentor_ID', 'user_id', 'id'].filter(Boolean);
      return idFields.some(field => columnNames.includes(field as string));
    } catch (err) {
      return false;
    }
  },

  testEndpoints: async () => {
    try {
      const results = await simpleClient.debugConnection();
      // Ensure we always return an array
      return Array.isArray(results) ? results : [results];
    } catch (error: any) {
      // Return an array with error object
      return [{ error: error.message, success: false }];
    }
  }
};