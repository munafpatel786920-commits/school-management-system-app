'use server';
/**
 * @fileOverview AI Document Generator with Institutional Branding Rules.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDocumentInputSchema = z.object({
  docType: z.string().describe('The type of document to generate (e.g., Notice, Letter, Certificate).'),
  prompt: z.string().describe('The content of the document.'),
  schoolProfile: z.object({
    name: z.string(),
    address: z.string(),
    principalName: z.string(),
    logoUrl: z.string().optional(),
    udiseCode: z.string().optional(),
    affiliationNo: z.string().optional(),
  }).describe('The school\'s profile information.'),
});
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

const GenerateDocumentOutputSchema = z.object({
  htmlContent: z.string().describe('The generated document as an HTML string.'),
});
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;

export async function generateDocument(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  return generateDocumentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateDocumentPrompt',
    input: { schema: GenerateDocumentInputSchema },
    output: { schema: GenerateDocumentOutputSchema },
    prompt: `You are a professional administrative officer at {{{schoolProfile.name}}}. 
    Your task is to generate a professional "{{{docType}}}" in HTML format suitable for printing on A4.

    **CRITICAL DESIGN RULES:**
    1. **Logo Placement:** You MUST place the school logo (if provided) in the UPPER LEFT corner of the document.
    2. **Header Layout:** 
       - Logo: Top Left (width approx 80px).
       - School Name: Center aligned, large bold font, dark blue (#1a237e).
       - Address: Center aligned below name, smaller font.
       - Registry IDs (UDISE/Affiliation): Top Right, small bold font.
    3. **Professional Border:** Add a clean 1px border around the entire document content.
    4. **Typography:** Use clean sans-serif fonts. Use bold for labels.
    5. **Styling:** Use INLINE CSS ONLY. No external tags.
    6. **Content:** Base the document body on this user request: "{{{prompt}}}".
    7. **Closing:** Include a signature area for the Principal at the bottom right.

    School Details for Header:
    - Name: {{{schoolProfile.name}}}
    - Address: {{{schoolProfile.address}}}
    - Logo URL: {{{schoolProfile.logoUrl}}}
    - UDISE: {{{schoolProfile.udiseCode}}}
    - Affiliation: {{{schoolProfile.affiliationNo}}}

    Generate only the valid self-contained HTML.`,
});

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('AI Engine failed to generate document.');
    return output;
  }
);
