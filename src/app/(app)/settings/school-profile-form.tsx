
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useRef, useEffect, useMemo } from 'react'
import { Upload, Image as ImageIcon, Globe2, MapPin, Phone, UserRound, CalendarDays, Landmark, ShieldCheck, GraduationCap } from 'lucide-react'
import Image from 'next/image'
import { useSchoolProfile } from '@/context/school-profile-context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const formSchema = z.object({
  name: z.string().min(1, 'School name is required.'),
  phone: z.string().min(1, 'Contact number is required.'),
  affiliationNo: z.string().min(1, 'Registration number is required.'),
  schoolCode: z.string().min(1, 'Internal code is required.'),
  udiseCode: z.string().min(1, 'Primary ID is required.'),
  address: z.string().min(1, 'Address is required.'),
  logoUrl: z.string().optional(),
  principalName: z.string().min(1, "Principal's name is required."),
  academicYear: z.string().min(1, "Academic year is required."),
  educationBoard: z.string().min(1, "Education board is required."),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  locale: z.string().min(1),
})

const locales = [
  { label: 'India (en-IN)', value: 'en-IN' },
  { label: 'United States (en-US)', value: 'en-US' },
  { label: 'United Kingdom (en-GB)', value: 'en-GB' },
  { label: 'United Arab Emirates (en-AE)', value: 'en-AE' },
  { label: 'Australia (en-AU)', value: 'en-AU' },
  { label: 'Canada (en-CA)', value: 'en-CA' },
]

const regionConfigs: Record<string, { 
    currency: string, 
    symbol: string, 
    country: string,
    boards: string[],
    regLabel: string, 
    affLabel: string,
    yearPlaceholder: string,
    phonePlaceholder: string,
    addressPlaceholder: string
}> = {
  'en-IN': { 
    currency: 'INR', symbol: '₹', country: 'India',
    boards: ['CBSE', 'ICSE', 'State Board (SSC/HSC)', 'IB', 'IGCSE'],
    regLabel: 'U-DISE Code', affLabel: 'Affiliation No.',
    yearPlaceholder: '2024-2025', phonePlaceholder: '+91 98765 43210',
    addressPlaceholder: 'Street, District, State, Pincode'
  },
  'en-US': { 
    currency: 'USD', symbol: '$', country: 'USA',
    boards: ['Common Core', 'State Standards', 'IB (International Baccalaureate)', 'Advanced Placement (AP)'],
    regLabel: 'District ID', affLabel: 'Tax ID / EIN',
    yearPlaceholder: '2024-25', phonePlaceholder: '+1 (555) 000-0000',
    addressPlaceholder: 'Street, City, State, ZIP Code'
  },
  'en-GB': { 
    currency: 'GBP', symbol: '£', country: 'United Kingdom',
    boards: ['National Curriculum', 'GCSE / A-Levels', 'Scottish Highers'],
    regLabel: 'DfE Number', affLabel: 'Ofsted Registration',
    yearPlaceholder: 'Term 2024/25', phonePlaceholder: '+44 20 7946 0000',
    addressPlaceholder: 'Building, Street, City, Postcode'
  },
  'en-AE': { 
    currency: 'AED', symbol: 'د.إ', country: 'UAE',
    boards: ['Ministry of Education (MOE)', 'KHDA (Dubai)', 'ADEK (Abu Dhabi)', 'CBSE (International)', 'British (IGCSE)'],
    regLabel: 'ADECK / KHDA License', affLabel: 'MOE Registry No.',
    yearPlaceholder: '2024-2025', phonePlaceholder: '+971 4 000 0000',
    addressPlaceholder: 'Villa/Bldg, Area, Emirate'
  },
  'en-AU': { 
    currency: 'AUD', symbol: '$', country: 'Australia',
    boards: ['ACARA (National)', 'VCE (Victoria)', 'HSC (NSW)', 'QCE (Queensland)'],
    regLabel: 'ACARA ID', affLabel: 'Provider Code (CRICOS)',
    yearPlaceholder: 'Year 2024', phonePlaceholder: '+61 2 9000 0000',
    addressPlaceholder: 'Street, Suburb, State, Postcode'
  },
  'en-CA': { 
    currency: 'CAD', symbol: '$', country: 'Canada',
    boards: ['Provincial (Ontario)', 'Provincial (British Columbia)', 'Provincial (Alberta)', 'IB'],
    regLabel: 'BSID / Mident No.', affLabel: 'Charity BN',
    yearPlaceholder: '2024-2025', phonePlaceholder: '+1 (416) 000-0000',
    addressPlaceholder: 'Street, City, Province, Postal Code'
  },
};

export function SchoolProfileForm() {
  const { schoolProfile, updateSchoolProfile, isLoading } = useSchoolProfile()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        phone: '',
        affiliationNo: '',
        schoolCode: '',
        udiseCode: '',
        address: '',
        logoUrl: '',
        principalName: '',
        academicYear: '2024-2025',
        educationBoard: 'CBSE',
        currency: 'INR',
        currencySymbol: '₹',
        locale: 'en-IN'
    },
  })

  useEffect(() => {
    if(!isLoading && schoolProfile) {
      form.reset({
          name: schoolProfile.name || '',
          affiliationNo: schoolProfile.affiliationNo || '',
          schoolCode: schoolProfile.schoolCode || '',
          udiseCode: schoolProfile.udiseCode || '',
          address: schoolProfile.address || '',
          logoUrl: schoolProfile.logoUrl || '',
          principalName: schoolProfile.principalName || '',
          academicYear: schoolProfile.academicYear || '',
          educationBoard: schoolProfile.educationBoard || '',
          phone: schoolProfile.phone || '',
          currency: schoolProfile.currency || 'INR',
          currencySymbol: schoolProfile.currencySymbol || '₹',
          locale: schoolProfile.locale || 'en-IN'
      })
    }
  }, [schoolProfile, form, isLoading])

  const logoUrlValue = form.watch('logoUrl')
  const currentLocale = form.watch('locale')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeRegion = useMemo(() => {
    return regionConfigs[currentLocale] || regionConfigs['en-IN'];
  }, [currentLocale]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateSchoolProfile(values)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image too large", description: "Limit: 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => form.setValue('logoUrl', reader.result as string, { shouldValidate: true });
      reader.readAsDataURL(file);
    }
  };

  const onLocaleChange = (newLocale: string) => {
    form.setValue('locale', newLocale);
    const config = regionConfigs[newLocale];
    if (config) {
      form.setValue('currency', config.currency, { shouldValidate: true });
      form.setValue('currencySymbol', config.symbol, { shouldValidate: true });
      form.setValue('educationBoard', config.boards[0], { shouldValidate: true });
      toast({
        title: `Localized for ${config.country}`,
        description: `Form labels, currency, and boards updated to ${config.country} standards.`,
      });
    }
  }

  if (isLoading) {
    return (
       <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-md" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        
        {/* LOGO & IDENTITY */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <ShieldCheck className="h-5 w-5" />
            Institutional Identity
          </div>
          <Card className="bg-muted/30 border-dashed border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-xl bg-background flex items-center justify-center overflow-hidden border-2 border-muted hover:border-primary transition-all shadow-inner">
                    {logoUrlValue ? (
                      <Image src={logoUrlValue} alt="Logo" width={128} height={128} className="object-contain w-full h-full p-2" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Official School Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your school's registered name" className="text-lg font-bold h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Click image to upload official seal/logo
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* REGIONAL STANDARDS */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <Globe2 className="h-5 w-5" />
                Regional Standards & Board
            </div>
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="locale"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest">Country Registry</FormLabel>
                                <Select onValueChange={onLocaleChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-background border-2 border-primary/20">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {locales.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="educationBoard"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" /> Education Board
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="bg-background border-2 border-primary/20">
                                        <SelectValue placeholder="Select board" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {activeRegion.boards.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                        <SelectItem value="Other">Other / International</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest">Currency Code</FormLabel>
                                <FormControl>
                                    <Input readOnly {...field} className="bg-muted font-mono font-bold" />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="currencySymbol"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold uppercase text-[10px] tracking-widest">Symbol</FormLabel>
                                <FormControl>
                                    <Input readOnly {...field} className="bg-muted text-xl font-bold" />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* ADMINISTRATIVE DETAILS */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg border-b pb-2">
                <UserRound className="h-5 w-5" />
                Administration
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="principalName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Principal / Head of Institution</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="Full Name" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="academicYear"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Active Session</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={activeRegion.yearPlaceholder} {...field} className="pl-9" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </section>

        {/* COMPLIANCE & CONTACT */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg border-b pb-2">
                <MapPin className="h-5 w-5" />
                Registry & Contact
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="udiseCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="font-bold text-primary">{activeRegion.regLabel}</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder={`Enter ${activeRegion.regLabel}`} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="affiliationNo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{activeRegion.affLabel}</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder={`Enter ${activeRegion.affLabel}`} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Official Contact No.</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={activeRegion.phonePlaceholder} {...field} className="pl-9" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="schoolCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Internal Center/School Code</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="e.g. SC-001" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Registered Address</FormLabel>
                <FormControl>
                    <Input {...field} placeholder={activeRegion.addressPlaceholder} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </section>

        <div className="flex justify-end pt-6 border-t">
          <Button type="submit" size="lg" className="px-12 font-bold shadow-lg hover:scale-105 transition-transform bg-primary text-primary-foreground">
            Save Global Profile
          </Button>
        </div>
      </form>
    </Form>
  )
}
