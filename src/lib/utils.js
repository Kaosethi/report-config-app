// src/lib/utils.ts

/**
 * Validates a Tax ID string against the format xxxx-xxxx-xxxxx (13 digits).
 * @param taxId The Tax ID string to validate. Can be string, undefined, or null.
 * @returns True if the format is valid, false otherwise.
 */
export const validateTaxId = (taxId) => {
    if (!taxId) {
      // Handles null, undefined, and empty string scenarios
      return false;
    }
    // Regex explanation:
    // ^           Start of string
    // \d{4}       Exactly 4 digits
    // -           Literal hyphen
    // \d{4}       Exactly 4 digits
    // -           Literal hyphen
    // \d{5}       Exactly 5 digits
    // $           End of string
    const taxIdRegex = /^\d{4}-\d{4}-\d{5}$/;
    return taxIdRegex.test(taxId);
  };
  
  /**
   * Formats a raw string (potentially containing non-digits) into the Tax ID format (xxxx-xxxx-xxxxx).
   * It removes non-digits, truncates to 13 digits, and adds hyphens.
   * @param value The raw input string. Can be string, undefined, or null.
   * @returns The formatted Tax ID string, or an empty string if input is invalid/empty.
   */
  export const formatTaxId = (value) => {
        if (!value) {
            // Handle null, undefined, or empty string input gracefully
            return '';
        }
        const digits = value.replace(/\D/g, ''); // Remove all non-digit characters
        const maxLength = 13;
        const truncatedDigits = digits.slice(0, maxLength); // Ensure max 13 digits
    
        let formatted = '';
        if (truncatedDigits.length > 0) {
            formatted += truncatedDigits.substring(0, 4); // First 4 digits
        }
        if (truncatedDigits.length > 4) {
            formatted += '-' + truncatedDigits.substring(4, 8); // Add hyphen and next 4 digits
        }
        if (truncatedDigits.length > 8) {
            formatted += '-' + truncatedDigits.substring(8, 13); // Add hyphen and last 5 digits
        }
        return formatted;
    };
  
  // You can add other utility functions below, for example:
  /**
   * Formats a number as a currency string (example).
   * @param amount The numeric amount.
   * @returns A string formatted as currency (e.g., "$1,234.56").
   */
  /*
  export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Adjust currency code as needed
    }).format(amount);
  };
  */