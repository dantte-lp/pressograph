/**
 * SVG Sanitization Utilities
 *
 * Provides functions to sanitize text content for safe use in SVG exports.
 * Prevents XML parsing errors by escaping special characters and validating SVG output.
 *
 * @module lib/utils/svg-sanitization
 */

/**
 * Sanitize text for safe use in SVG/XML attributes and content
 *
 * Escapes special XML characters that can break SVG parsing:
 * - & (ampersand) → &amp;
 * - < (less than) → &lt;
 * - > (greater than) → &gt;
 * - " (double quote) → &quot;
 * - ' (single quote) → &apos;
 *
 * @param text - Text to sanitize (can be undefined or null)
 * @returns Sanitized text safe for SVG, or empty string if input is null/undefined
 *
 * @example
 * ```ts
 * sanitizeForSVG('Test "A&B" <data>') // Returns: 'Test &quot;A&amp;B&quot; &lt;data&gt;'
 * sanitizeForSVG(null) // Returns: ''
 * ```
 */
export function sanitizeForSVG(text: string | undefined | null): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate SVG string for well-formed XML
 *
 * Uses DOMParser to check if SVG is valid XML.
 * Returns error details if parsing fails.
 *
 * @param svgString - SVG string to validate
 * @returns Validation result with success flag and optional error message
 *
 * @example
 * ```ts
 * const result = validateSVG('<svg>...</svg>');
 * if (!result.valid) {
 *   console.error('SVG validation failed:', result.error);
 * }
 * ```
 */
export function validateSVG(svgString: string): { valid: boolean; error?: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Check for parser errors
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      const errorText = errorNode.textContent || 'Unknown parsing error';
      return {
        valid: false,
        error: errorText,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Clean and validate SVG string before download
 *
 * Performs comprehensive SVG sanitization:
 * 1. Validates SVG is well-formed XML
 * 2. Optionally applies additional cleaning (future: remove scripts, etc.)
 *
 * @param svgString - SVG string to clean and validate
 * @returns Cleaned SVG string
 * @throws Error if SVG is invalid and cannot be cleaned
 *
 * @example
 * ```ts
 * try {
 *   const cleanSVG = cleanSVGForExport(rawSVG);
 *   // Safe to download
 * } catch (error) {
 *   console.error('SVG cleaning failed:', error);
 * }
 * ```
 */
export function cleanSVGForExport(svgString: string): string {
  // Validate SVG
  const validation = validateSVG(svgString);
  if (!validation.valid) {
    throw new Error(`Invalid SVG: ${validation.error}`);
  }

  // Future: Additional cleaning steps could go here
  // - Remove script tags
  // - Sanitize event handlers
  // - Validate namespace declarations

  return svgString;
}

/**
 * Sanitize multiple text values in an object
 *
 * Recursively sanitizes all string values in a nested object.
 * Useful for sanitizing entire chart configuration objects.
 *
 * @param obj - Object with string values to sanitize
 * @returns New object with all strings sanitized
 *
 * @example
 * ```ts
 * const config = {
 *   title: 'Test "A&B"',
 *   subtitle: { text: '<Data>' },
 * };
 * const clean = sanitizeObjectForSVG(config);
 * // Returns: { title: 'Test &quot;A&amp;B&quot;', subtitle: { text: '&lt;Data&gt;' } }
 * ```
 */
export function sanitizeObjectForSVG<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeForSVG(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForSVG(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObjectForSVG(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Create a downloadable blob from SVG string with validation
 *
 * Validates SVG and creates a properly formatted blob for download.
 *
 * @param svgString - SVG string to convert to blob
 * @param filename - Filename for download (without extension)
 * @returns Blob URL for download
 * @throws Error if SVG is invalid
 *
 * @example
 * ```ts
 * try {
 *   const { blob, url } = createSVGBlob(svgString, 'pressure-test');
 *   const link = document.createElement('a');
 *   link.download = 'pressure-test.svg';
 *   link.href = url;
 *   link.click();
 *   URL.revokeObjectURL(url); // Clean up
 * } catch (error) {
 *   console.error('Failed to create SVG blob:', error);
 * }
 * ```
 */
export function createSVGBlob(
  svgString: string,
  _filename: string
): { blob: Blob; url: string } {
  // Validate and clean SVG
  const cleanedSVG = cleanSVGForExport(svgString);

  // Create blob with proper MIME type
  const blob = new Blob([cleanedSVG], {
    type: 'image/svg+xml;charset=utf-8',
  });

  // Create object URL
  const url = URL.createObjectURL(blob);

  return { blob, url };
}
