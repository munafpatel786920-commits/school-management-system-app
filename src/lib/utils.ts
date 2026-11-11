import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Global Region Labels Helper
 * Returns localized strings for IDs and Codes based on school locale
 */
export const getRegionLabels = (locale: string = 'en-IN') => {
  const configs: Record<string, { regLabel: string; affLabel: string; idLabel: string; nationalId: string }> = {
    'en-IN': { regLabel: 'U-DISE Code', affLabel: 'Affiliation No.', idLabel: 'GR No.', nationalId: 'Aadhaar' },
    'en-US': { regLabel: 'District ID', affLabel: 'Tax ID / EIN', idLabel: 'Student ID', nationalId: 'SSN' },
    'en-GB': { regLabel: 'DfE Number', affLabel: 'Ofsted Reg No.', idLabel: 'Admin ID', nationalId: 'NI Number' },
    'en-AE': { regLabel: 'KHDA License', affLabel: 'MOE Registry', idLabel: 'SIS ID', nationalId: 'Emirates ID' },
    'en-AU': { regLabel: 'ACARA ID', affLabel: 'Provider Code', idLabel: 'USI', nationalId: 'TFN' },
    'en-CA': { regLabel: 'BSID No.', affLabel: 'Charity BN', idLabel: 'OEN', nationalId: 'SIN' },
  }
  return configs[locale] || configs['en-IN']
}

/**
 * Currency Formatter Helper
 */
export const formatMoney = (amount: number, locale: string = 'en-IN', currency: string = 'INR') => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (e) {
        console.error("formatMoney failed:", e);
        return `${currency} ${amount.toLocaleString()}`;
    }
}

/**
 * Student Promotion Logic
 * Defines the sequence of classes for automatic promotion
 */
export const getNextClass = (currentClass: string): string | 'COMPLETED' => {
  const sequence = [
    'Nursery', 'LKG', 'UKG', 
    '1st', '2nd', '3rd', '4th', '5th', 
    '6th', '7th', '8th', '9th', '10th', 
    '11th', '12th'
  ];
  
  // Find match (case insensitive)
  const index = sequence.findIndex(c => c.toLowerCase() === currentClass.toLowerCase());
  
  if (index === -1) return currentClass; // Keep same if not in standard sequence
  if (index === sequence.length - 1) return 'COMPLETED';
  
  return sequence[index + 1];
}
