/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate that a query parameter exists and is a string
 */
export const validateQueryParam = (
  query: unknown,
  paramName: string = 'q'
): ValidationResult => {
  if (!query || typeof query !== 'string') {
    return {
      isValid: false,
      error: `Query parameter "${paramName}" is required`,
    };
  }
  return { isValid: true };
};

/**
 * Validate and parse page number
 */
export const validatePageNumber = (page: unknown): ValidationResult & { value?: number } => {
  if (!page) {
    return { isValid: true, value: 1 }; // Default to page 1
  }

  const pageNumber = Number.parseInt(page as string, 10);

  if (Number.isNaN(pageNumber) || pageNumber < 1) {
    return {
      isValid: false,
      error: 'Invalid page number',
    };
  }

  return { isValid: true, value: pageNumber };
};

/**
 * Validate movie input data
 */
export const validateMovieInput = (data: {
  id?: unknown;
  title?: unknown;
  year?: unknown;
  poster?: unknown;
}): ValidationResult => {
  const { id, title, year, poster } = data;

  if (!id || !title || !year || !poster) {
    return {
      isValid: false,
      error: 'Missing required fields: id, title, year, poster',
    };
  }

  return { isValid: true };
};

/**
 * Check if a poster URL is valid (not N/A)
 */
export const isValidPoster = (poster: string): boolean => {
  return poster !== 'N/A' && poster.trim() !== '';
};
