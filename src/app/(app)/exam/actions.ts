
'use server';

import { generateRemarks } from '@/ai/flows/generate-student-remarks';

export async function generateRemarksAction(input: any) {
    try {
        const result = await generateRemarks(input);
        return { success: true, remarks: result.remarks };
    } catch (error) {
        console.error("AI Error:", error);
        return { success: false, error: 'AI Assistant temporarily offline.' };
    }
}
