// ═══════════════════════════════════════════════════════════════════
// API Service - Backend Communication
// ═══════════════════════════════════════════════════════════════════

import type { TestSettings, Theme } from '../types';

/**
 * API configuration
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/v1`;

/**
 * PNG Export Configuration
 */
export interface PNGExportConfig {
  settings: TestSettings;
  theme?: Theme;
  scale?: number; // 1-4, default: 2
  width?: number; // 400-4000, default: 1200
  height?: number; // 300-3000, default: 800
  comment?: string; // Optional comment to save with the graph
}

/**
 * PDF Export Configuration
 */
export interface PDFExportConfig {
  settings: TestSettings;
  theme?: Theme;
  scale?: number;
  width?: number;
  height?: number;
  comment?: string;
}

/**
 * JSON Export Configuration
 */
export interface JSONExportConfig {
  settings: TestSettings;
  comment?: string;
}

/**
 * Export Response Metadata
 */
export interface ExportMetadata {
  filename: string;
  fileSize: number;
  generationTimeMs: number;
}

/**
 * API Error Response
 */
export interface APIError {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Export PNG via backend API
 *
 * Sends graph settings to backend, which renders the graph
 * server-side using node-canvas and returns a PNG file.
 *
 * @param config - PNG export configuration
 * @returns Promise with blob, filename, and metadata
 * @throws Error if export fails or validation errors occur
 */
export const exportPNG = async (
  config: PNGExportConfig
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/export/png`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    // Try to parse error message
    let errorMessage = 'PNG export failed';
    try {
      const errorData: APIError = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = `PNG export failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Extract metadata from headers
  const filename = extractFilenameFromHeaders(response.headers);
  const fileSize = parseInt(response.headers.get('X-File-Size') || '0', 10);
  const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10);

  // Get blob
  const blob = await response.blob();

  return {
    blob,
    filename,
    metadata: {
      filename,
      fileSize,
      generationTimeMs,
    },
  };
};

/**
 * Export PDF via backend API
 *
 * Sends graph settings to backend, which renders the graph
 * server-side and returns a PDF file.
 *
 * @param config - PDF export configuration
 * @returns Promise with blob, filename, and metadata
 * @throws Error if export fails or validation errors occur
 */
export const exportPDF = async (
  config: PDFExportConfig
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = 'PDF export failed';
    try {
      const errorData: APIError = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `PDF export failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const filename = extractFilenameFromHeaders(response.headers);
  const fileSize = parseInt(response.headers.get('X-File-Size') || '0', 10);
  const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10);

  const blob = await response.blob();

  return {
    blob,
    filename,
    metadata: {
      filename,
      fileSize,
      generationTimeMs,
    },
  };
};

/**
 * Export JSON via backend API
 *
 * Sends graph settings to backend, which returns the graph data
 * and settings as JSON.
 *
 * @param config - JSON export configuration
 * @returns Promise with blob, filename, and metadata
 * @throws Error if export fails or validation errors occur
 */
export const exportJSON = async (
  config: JSONExportConfig
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/export/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = 'JSON export failed';
    try {
      const errorData: APIError = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `JSON export failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const filename = extractFilenameFromHeaders(response.headers);
  const fileSize = parseInt(response.headers.get('X-File-Size') || '0', 10);
  const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10);

  const blob = await response.blob();

  return {
    blob,
    filename,
    metadata: {
      filename,
      fileSize,
      generationTimeMs,
    },
  };
};

/**
 * Extract filename from Content-Disposition header
 *
 * @param headers - Response headers
 * @returns Extracted filename or fallback
 */
const extractFilenameFromHeaders = (headers: Headers): string => {
  const disposition = headers.get('Content-Disposition');
  if (!disposition) {
    return `pressure_test_${Date.now()}.png`;
  }

  // Parse: attachment; filename="graph-123-1234567890.png"
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1];
  }

  return `pressure_test_${Date.now()}.png`;
};

/**
 * Validate test settings via backend
 *
 * @param settings - Test settings to validate
 * @returns Validation result
 */
export const validateSettings = async (
  settings: TestSettings
): Promise<{ valid: boolean; errors?: Array<{ field: string; message: string }> }> => {
  const response = await fetch(`${API_BASE}/graph/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  const data = await response.json();
  return {
    valid: data.valid,
    errors: data.errors,
  };
};

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Format generation time for display
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "1.23s")
 */
export const formatGenerationTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Graph History Item from backend
 */
export interface GraphHistoryItem {
  id: number;
  test_number: string;
  settings: TestSettings;
  export_format: 'png' | 'pdf' | 'json';
  file_path: string | null;
  file_size: number;
  generation_time_ms: number;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
  comment?: string;
}

/**
 * History Query Parameters
 */
export interface HistoryQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  format?: string;
  sortBy?: 'created_at' | 'test_number' | 'export_format' | 'file_size';
  sortOrder?: 'asc' | 'desc';
}

/**
 * History Response
 */
export interface HistoryResponse {
  success: boolean;
  graphs: GraphHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Share Link Options
 */
export interface ShareLinkOptions {
  graphId: number;
  expiresIn?: number; // seconds
  maxViews?: number;
  allowDownload?: boolean;
}

/**
 * Share Link Response
 */
export interface ShareLinkResponse {
  success: boolean;
  shareLink: {
    id: number;
    token: string;
    url: string;
    expiresAt: string | null;
    maxViews: number | null;
    allowDownload: boolean;
    createdAt: string;
  };
}

/**
 * Get authentication token from localStorage
 * NOTE: The auth store persists to localStorage under 'auth-storage' key
 */
const getAuthToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.accessToken || null;
    }
  } catch (error) {
    console.error('[Pressograph] Failed to get auth token:', error);
  }
  return null;
};

/**
 * Get history of generated graphs
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with history data
 * @throws Error if request fails
 */
export const getHistory = async (params: HistoryQueryParams = {}): Promise<HistoryResponse> => {
  const queryParams = new URLSearchParams();

  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.format && params.format !== 'all') queryParams.append('format', params.format);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return await response.json();
};

/**
 * Delete a graph from history
 *
 * @param graphId - ID of graph to delete
 * @returns Promise with success status
 * @throws Error if deletion fails
 */
export const deleteGraph = async (
  graphId: number
): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history/${graphId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(errorData.error || 'Failed to delete graph');
  }

  return await response.json();
};

/**
 * Update comment for a graph
 *
 * @param graphId - ID of graph to update
 * @param comment - New comment text
 * @returns Promise with success status
 * @throws Error if update fails
 */
export const updateComment = async (
  graphId: number,
  comment: string
): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history/${graphId}/comment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
    throw new Error(errorData.error || 'Failed to update comment');
  }

  return await response.json();
};

/**
 * Download a graph file
 *
 * @param graphId - ID of graph to download
 * @returns Promise with blob and filename
 * @throws Error if download fails
 */
export const downloadGraph = async (graphId: number): Promise<{ blob: Blob; filename: string }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history/${graphId}/download`, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download graph');
  }

  const filename = extractFilenameFromHeaders(response.headers);
  const blob = await response.blob();

  return { blob, filename };
};

/**
 * Create a shareable link for a graph
 *
 * @param options - Share link configuration
 * @returns Promise with share link data
 * @throws Error if creation fails
 */
export const createShareLink = async (options: ShareLinkOptions): Promise<ShareLinkResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Share link creation failed' }));
    throw new Error(errorData.error || 'Failed to create share link');
  }

  return await response.json();
};

/**
 * Regenerate Configuration
 */
export interface RegenerateConfig {
  format: 'png' | 'pdf' | 'json';
  theme?: 'light' | 'dark';
  scale?: number;
  width?: number;
  height?: number;
}

/**
 * Regenerate a graph from history with new format or theme
 *
 * @param graphId - ID of graph to regenerate
 * @param config - Regeneration configuration (format, theme)
 * @returns Promise with blob, filename, and metadata
 * @throws Error if regeneration fails
 */
export const regenerateGraph = async (
  graphId: number,
  config: RegenerateConfig
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history/${graphId}/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    let errorMessage = 'Graph regeneration failed';
    try {
      const errorData: APIError = await response.json();
      if (errorData.errors && errorData.errors.length > 0) {
        errorMessage = errorData.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `Regeneration failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const filename = extractFilenameFromHeaders(response.headers);
  const fileSize = parseInt(response.headers.get('X-File-Size') || '0', 10);
  const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10);

  const blob = await response.blob();

  return {
    blob,
    filename,
    metadata: {
      filename,
      fileSize,
      generationTimeMs,
    },
  };
};

/**
 * Format relative time (e.g., "2 hours ago")
 *
 * @param dateString - ISO date string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  // For older dates, show absolute date
  return date.toLocaleDateString();
};

/**
 * Format date as dd/mm/yyyy
 *
 * @param dateString - ISO date string
 * @returns Formatted date string (dd/mm/yyyy)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
