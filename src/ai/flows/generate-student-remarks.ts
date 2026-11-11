
'use server';
/**
 * @fileOverview AI Flow to generate student performance remarks.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InputSchema = z.object({
  studentName: z.string(),
  overallPercentage: z.number(),
  marks: z.array(z.object({
    subject: z.string(),
    score: z.number(),
    max: z.number(),
  })),
});

const OutputSchema = z.object({
  remarks: z.string(),
});

export async function generateRemarks(input: z.infer<typeof InputSchema>): Promise<z.infer<typeof OutputSchema>> {
  return generateRemarksFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateRemarksPrompt',
    input: { schema: InputSchema },
    output: { schema: OutputSchema },
    prompt: `You are an experienced and empathetic school teacher. Your task is to write a personalized, 2-sentence performance remark for a student named {{studentName}}.

    **Student Performance Data:**
    - Percentage: {{overallPercentage}}%
    - Detailed Scores: {{#each marks}}{{subject}}: {{score}}/{{max}}, {{/each}}

    **Guidelines:**
    1. If the percentage is > 80%, be highly appreciative and encourage them to aim for excellence.
    2. If the percentage is 50-80%, acknowledge their hard work but point out subjects where they can improve.
    3. If the percentage is < 50%, be supportive and focus on identifying key areas for growth without being discouraging.
    4. Keep it professional yet warm. Do not use generic phrases like "Good job".

    Generate only the remarks.`,
});

const generateRemarksFlow = ai.defineFlow(
  {
    name: 'generateRemarksFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('AI Remark Generation Failed');
    return output;
  }
);
