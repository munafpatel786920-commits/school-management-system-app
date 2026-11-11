'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSchoolProfile } from '@/context/school-profile-context';
import { generateDocumentAction } from './actions';
import { toast } from '@/hooks/use-toast';
import { Wand } from 'lucide-react';

const formSchema = z.object({
  docType: z.string().min(1, 'Please select a document type.'),
  prompt: z.string().min(10, 'Please provide a detailed prompt for the document.'),
});

type DocumentGeneratorFormProps = {
  onDocumentGenerated: (html: string) => void;
};

export function DocumentGeneratorForm({ onDocumentGenerated }: DocumentGeneratorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { schoolProfile } = useSchoolProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docType: 'Notice',
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await generateDocumentAction({
      ...values,
      schoolProfile: {
        name: schoolProfile.name,
        address: schoolProfile.address,
        principalName: schoolProfile.principalName,
        logoUrl: schoolProfile.logoUrl,
      },
    });
    setIsLoading(false);

    if (result.success && result.htmlContent) {
      onDocumentGenerated(result.htmlContent);
      toast({
        title: 'Document Generated',
        description: 'Your document has been created by the AI assistant.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Document Generator</CardTitle>
        <CardDescription>
          Use AI to generate official documents like notices, letters, or certificates. Provide a clear prompt below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="docType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Notice">Notice</SelectItem>
                      <SelectItem value="Certificate">Certificate</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Application">Application</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Generate a notice for all students about the annual sports day on December 20th. Include details about participation and events.'"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Wand className="mr-2 h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
