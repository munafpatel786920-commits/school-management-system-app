'use server';

import { generateDocument, type GenerateDocumentInput } from '@/ai/flows/generate-school-documents';
import { z } from 'zod';

const ActionInputSchema = z.object({
  docType: z.string(),
  prompt: z.string(),
  schoolProfile: z.object({
    name: z.string(),
    address: z.string(),
    principalName: z.string(),
    logoUrl: z.string().optional(),
  }),
});

export async function generateDocumentAction(input: z.infer<typeof ActionInputSchema>) {
    try {
        const validatedInput = ActionInputSchema.parse(input);
        const result = await generateDocument(validatedInput as GenerateDocumentInput);
        return { success: true, htmlContent: result.htmlContent };
    } catch (error) {
        console.error("Error generating document:", error);
        if (error instanceof z.ZodError) {
             return { success: false, error: 'Invalid input provided.' };
        }
        return { success: false, error: 'Failed to generate the document with AI. Please try again.' };
    }
}
