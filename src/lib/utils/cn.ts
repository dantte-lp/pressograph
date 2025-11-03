import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @param inputs - Class names or conditional class objects
 * @returns Merged and deduplicated class string
 *
 * @example
 * ```tsx
 * cn("px-2 py-1", "px-3") // => "py-1 px-3"
 * cn("text-red-500", condition && "text-blue-500") // => "text-blue-500" if condition is true
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
