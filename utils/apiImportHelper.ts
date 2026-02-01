
import { FieldType, ApiQueryParam } from '../types/index';

// Infers the best matching field type for a given value
export const inferFieldType = (value: any): FieldType => {
    if (typeof value === 'number') {
        // Check for potential timestamps (e.g. > 1990-01-01 in seconds)
        // 631152000 is 1990-01-01 in seconds
        // 631152000000 is 1990-01-01 in ms
        // If it looks like a timestamp, we suggest DATETIME, but we might need user confirmation in a real app
        // For this demo, if it's a huge integer, treat as DATETIME if sensible, or INTEGER
        if (value > 631152000 && Number.isInteger(value)) {
            return 'DATETIME';
        }
        return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    
    // Simple Date check (YYYY-MM-DD or ISO)
    if (typeof value === 'string' && value.length > 5) {
        if (!isNaN(Date.parse(value)) && (value.includes('-') || value.includes('/') || value.includes('T'))) {
            return 'DATETIME'; // or DATE
        }
    }
    return 'VARCHAR';
};

// Flattens nested JSON objects to a single level (optional deep flatten)
export const flattenApiData = (data: any[]): any[] => {
    return data.map(row => {
        const newRow: any = {};
        for (const key in row) {
            if (typeof row[key] === 'object' && row[key] !== null) {
                // If it's an object/array, stringify it to store as text/json
                // Alternatively, complex logic could create sub-tables
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
                // If baseUrl is relative or invalid, fallback (though URL ctor usually requires valid)
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
