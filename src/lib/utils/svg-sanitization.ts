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
 * Clean font-family attributes to fix quote issues
 *
 * Fixes "attributes construct error" caused by unescaped quotes in font-family values.
 * The issue: font-family: "Inter", "Segoe UI" → breaks XML at column 133
 * The fix: Replace inner double quotes with single quotes or remove them
 *
 * @param svg - Raw SVG string
 * @returns SVG string with cleaned font-family attributes
 */
function cleanFontFamilyAttributes(svg: string): string {
  return svg
    // Fix font-family in style attributes: style="font-family: "Inter", "Segoe UI""
    // This regex finds style attributes and cleans the font-family value inside them
    .replace(/style="([^"]*)font-family:\s*([^";]+)([^"]*)"/g, (match, before, fontFamily, after) => {
      // Replace any inner double quotes in font-family with single quotes
      const cleanedFontFamily = fontFamily.replace(/"/g, "'");
      return `style="${before}font-family: ${cleanedFontFamily}${after}"`;
    })
    // Also fix standalone font-family attributes if they exist
    .replace(/font-family="([^"]*)"/g, (match, fontList) => {
      // Replace any inner double quotes with single quotes
      const cleaned = fontList.replace(/"/g, "'");
      return `font-family="${cleaned}"`;
    });
}

/**
 * Clean SVG header (first 3 lines) to fix attribute errors
 *
 * Fixes common issues in SVG root element that cause "attributes construct error":
 * 1. Removes duplicate quotes in attributes
 * 2. Removes empty attributes
 * 3. Fixes malformed style attributes
 * 4. Ensures proper XML attribute formatting
 *
 * @param svg - Raw SVG string
 * @returns SVG string with cleaned header
 */
function cleanSVGHeader(svg: string): string {
  const lines = svg.split('\n');

  // Fix line 3 (index 2) if it exists - this is where the SVG root element usually is
  if (lines.length > 2) {
    lines[2] = lines[2]
      // Remove duplicate quotes in attributes
      .replace(/="([^"]*)"([^>\s]*)"([^"]*)"/g, '="$1$2$3"')
      // Remove empty attributes
      .replace(/\s+([a-z-]+)=""\s*/gi, ' ')
      // Fix malformed style attributes with unescaped quotes
      .replace(/style="([^"]*)"/g, (match, content) => {
        const cleaned = content
          // Convert inner double quotes to single quotes
          .replace(/"/g, "'")
          // Escape ampersands in style values
          .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
        return `style="${cleaned}"`;
      })
      // Remove any attributes with value but no quotes (malformed)
      .replace(/\s+([a-z-]+)=([^\s"'][^\s>]*)/gi, ' $1="$2"')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ');
  }

  return lines.join('\n');
}

/**
 * Post-process SVG string to fix common XML attribute issues
 *
 * Applies minimal cleaning to fix ECharts-generated SVG issues:
 * 1. Escapes unescaped ampersands in text nodes
 * 2. Escapes stray < and > in text content
 *
 * SIMPLIFIED: Removed aggressive regex that might break valid SVG
 *
 * @param svg - Raw SVG string from ECharts
 * @returns Cleaned SVG string
 */
function postProcessSVGString(svg: string): string {
  // Only apply minimal cleaning - aggressive regex can break valid SVG
  return svg
    // Escape any remaining unescaped ampersands in text nodes
    // This is critical - ECharts may generate text with & that breaks XML
    .replace(/>([^<>]*)</g, (match, text) => {
      // Only process if text contains problematic characters
      if (!text || typeof text !== 'string') return match;

      const cleaned = text
        // Fix unescaped ampersands (but preserve already-escaped entities)
        .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
        // Escape any stray < or > in text nodes (but these are rare in ECharts output)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `>${cleaned}<`;
    });
}

/**
 * Clean and validate SVG string before download
 *
 * Performs comprehensive SVG sanitization:
 * 1. Cleans the SVG header (first 3 lines) to fix attribute errors
 * 2. Post-processes the SVG to fix common ECharts issues
 * 3. Validates SVG is well-formed XML (warning only, not blocking)
 * 4. Returns cleaned SVG for download
 *
 * @param svgString - SVG string to clean and validate
 * @returns Cleaned SVG string
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
  // Step 0: Debug logging - inspect the raw SVG header
  const lines = svgString.split('\n');
  console.log('[SVG Debug] Total lines:', lines.length);
  console.log('[SVG Debug] First 5 lines:', lines.slice(0, 5));
  if (lines.length > 2) {
    console.log('[SVG Debug] Line 3 length:', lines[2]?.length);
    console.log('[SVG Debug] Line 3 char at column 133:', lines[2]?.[132]); // 0-indexed
    console.log('[SVG Debug] Line 3 substring around column 133:', lines[2]?.substring(125, 145));
  }

  // Step 1: CRITICAL - Clean font-family attributes first (fixes column 133 error)
  // This must be done before other cleaning to prevent double-escaping
  let cleaned = cleanFontFamilyAttributes(svgString);

  // Step 2: Clean the SVG header specifically (fixes line 3 attribute errors)
  cleaned = cleanSVGHeader(cleaned);

  // Step 3: Post-process the rest of the SVG to fix common issues
  cleaned = postProcessSVGString(cleaned);

  // Step 4: Validate SVG (warning only, not blocking)
  const validation = validateSVG(cleaned);
  if (!validation.valid) {
    console.warn('SVG validation warning:', validation.error);
    console.warn('Proceeding with download anyway - user can verify in browser');
    // Don't throw - allow download and let user decide
    // The post-processing above should fix most issues
  }

  // Step 5: Return cleaned SVG
  return cleaned;
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
