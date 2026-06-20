
import { FieldType, ApiQueryParam } from '../types/index';

// Infers the best matching field type for a given value
export const inferFieldType = (value: any): FieldType => {
    if (typeof value === 'number') {
        // Check for potential timestamps (e.g. > 1990-01-01 in seconds)
        if (value > 631152000 && Number.isInteger(value)) {
            return 'DATETIME';
        }
        return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    
    // Simple Date check (YYYY-MM-DD or ISO)
    if (typeof value === 'string' && value.length > 5) {
        if (!isNaN(Date.parse(value)) && (value.includes('-') || value.includes('/') || value.includes('T'))) {
            if (value.length <= 10 && !value.includes('T')) return 'DATE';
            return 'DATETIME'; 
        }
    }
    if (typeof value === 'string' && value.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        return 'TIME';
    }
    return 'VARCHAR';
};

// Flattens nested JSON objects to a single level, BUT keeps Arrays intact for extraction tools
export const flattenApiData = (data: any[]): any[] => {
    return data.map((row, index) => {
        const newRow: any = { _ImportId: index + 1 }; // Add stable ID for linking
        for (const key in row) {
            if (Array.isArray(row[key])) {
                // KEEP ARRAYS as raw data for the Extraction Wizard
                newRow[key] = row[key];
            } else if (typeof row[key] === 'object' && row[key] !== null) {
                // Flatten simple objects to string or extract sub-keys could be better, 
                // but for now stringify objects to avoid [object Object] mess in grid
                newRow[key] = JSON.stringify(row[key]);
            } else {
                newRow[key] = row[key];
            }
        }
        return newRow;
    });
};

export interface FetchResult {
    data: any[];
    error: string | null;
    fullUrl: string; // Return the constructed URL for debugging
}

export const fetchApiData = async (baseUrl: string, method: string, headersStr?: string, queryParams?: ApiQueryParam[]): Promise<FetchResult> => {
    try {
        const headers: HeadersInit = headersStr ? JSON.parse(headersStr) : {};
        
        // Construct URL with params
        let finalUrl = baseUrl;
        if (queryParams && queryParams.length > 0) {
            try {
                const urlObj = new URL(baseUrl);
                queryParams.forEach(p => {
                    if (p.isActive && p.key) {
                        urlObj.searchParams.append(p.key, p.value);
                    }
                });
                finalUrl = urlObj.toString();
            } catch (e) {
                console.warn("Invalid Base URL for param appending", e);
            }
        }

        const response = await fetch(finalUrl, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        
        // Normalize data: Ensure it's an array
        let tableData: any[] = [];
        if (Array.isArray(jsonData)) {
            tableData = jsonData;
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Try to find an array property if the root is an object (common in paginated APIs)
            const possibleArray = Object.values(jsonData).find(val => Array.isArray(val));
            if (possibleArray) {
                tableData = possibleArray as any[];
            } else {
                tableData = [jsonData]; // Single object -> single row
            }
        }

        return { data: flattenApiData(tableData), error: null, fullUrl: finalUrl };
    } catch (err: any) {
        return { data: [], error: err.message || 'Fehler beim Abrufen der Daten', fullUrl: baseUrl };
    }
};
