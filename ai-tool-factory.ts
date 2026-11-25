import { tools, runTool } from '@/lib/tool-engine/registry';
import { buildKeywordBlueprint, type KeywordSignal, type ToolBlueprint } from '@/lib/seo/tool-autopilot';

export type FactoryLocale = 'en' | 'ar' | 'hi' | 'bn';
export type FactoryToolManifest = {
  id: string; name: string; slug: string; description: string; category: string; keywords: string[];
  kind: string; version: number; status: 'review';
  inputs: Array<{ id: 'input' | 'extra'; type: 'textarea' | 'text'; required: boolean; label: Record<FactoryLocale, string>; placeholder: Record<FactoryLocale, string> }>;
  output: { type: 'text'; label: Record<FactoryLocale, string>; copyable: true };
  seo: { title: string; description: string };
  localizedSeo: Record<FactoryLocale, { title: string; description: string }>;
  faq: Array<{ question: string; answer: string }>;
  examples: Array<{ input: string; output: string }>;
  instructions: string[];
  localizedContent: Record<FactoryLocale, { intro: string; howTo: string[] }>;
  safety: { processor: 'reviewed-built-in'; arbitraryCode: false; networkAccess: false; fileAccess: false };
  quality: { score: number; passed: boolean; checks: Array<{ id: string; passed: boolean; message: string }> };
};

type TestCase = { input: string; extra?: string; includes?: string; pattern?: RegExp };
const cases: Record<string, TestCase[]> = {
  count: [{ input: 'hello world', includes: 'Words: 2' }, { input: 'one\n\ntwo', includes: 'Paragraphs: 2' }],
  jsonFormat: [{ input: '{"a":1}', includes: '"a": 1' }],
  jsonValidate: [{ input: '{"ok":true}', includes: 'Valid JSON' }, { input: '{bad}', includes: 'Invalid JSON' }],
  b64encode: [{ input: 'hello', includes: 'aGVsbG8=' }],
  b64decode: [{ input: 'aGVsbG8=', includes: 'hello' }],
  urlencode: [{ input: 'hello world', includes: 'hello%20world' }],
  urldecode: [{ input: 'hello%20world', includes: 'hello world' }],
  density: [{ input: 'seo seo tools', extra: 'seo', includes: 'Occurrences: 2' }],
  metaTitle: [{ input: 'A useful title', includes: 'A useful title' }],
  metaDescription: [{ input: 'A useful description', includes: 'A useful description' }],
  discount: [{ input: '100', extra: '20', includes: '80.00' }],
  percentage: [{ input: '200', extra: '10', includes: '20.00' }],
};
const labels: Record<string, Record<FactoryLocale, string>> = {
  input: { en: 'Your input', ar: 'أدخل النص أو القيمة', hi: 'अपना इनपुट', bn: 'আপনার ইনপুট' },
  extra: { en: 'Additional value', ar: 'قيمة إضافية', hi: 'अतिरिक्त मान', bn: 'অতিরিক্ত মান' },
  output: { en: 'Result', ar: 'النتيجة', hi: 'परिणाम', bn: 'ফলাফল' },
};
const intros: Record<FactoryLocale, string> = {
  en: 'A focused browser-based utility that runs with a reviewed FreeToolForge processor.',
  ar: 'أداة مباشرة تعمل داخل المتصفح باستخدام معالج موثوق ومراجع في FreeToolForge.',
  hi: 'एक सरल ब्राउज़र टूल जो FreeToolForge के सत्यापित प्रोसेसर का उपयोग करता है।',
  bn: 'FreeToolForge-এর পর্যালোচিত প্রসেসর ব্যবহার করে ব্রাউজারে চলা একটি সহজ টুল।',
};
const steps: Record<FactoryLocale, string[]> = {
  en: ['Enter the value in the input field.', 'Add an optional value if the tool requests one.', 'Run the tool and review or copy the result.'],
  ar: ['أدخل القيمة في حقل الإدخال.', 'أضف قيمة إضافية إذا طلبت الأداة ذلك.', 'شغّل الأداة ثم راجع النتيجة أو انسخها.'],
  hi: ['इनपुट फ़ील्ड में मान दर्ज करें।', 'यदि आवश्यक हो तो अतिरिक्त मान दें।', 'टूल चलाएँ और परिणाम देखें या कॉपी करें।'],
  bn: ['ইনপুট ঘরে মান লিখুন।', 'প্রয়োজন হলে অতিরিক্ত মান দিন।', 'টুল চালিয়ে ফলাফল দেখুন বা কপি করুন।'],
};
function localizedTitle(name: string, locale: FactoryLocale) {
  const known: Record<string, Record<FactoryLocale, string>> = {
    'Discount Calculator': { en: name, ar: 'حاسبة الخصم', hi: 'छूट कैलकुलेटर', bn: 'ছাড় ক্যালকুলেটর' },
    'Percentage Calculator': { en: name, ar: 'حاسبة النسبة المئوية', hi: 'प्रतिशत कैलकुलेटर', bn: 'শতাংশ ক্যালকুলেটর' },
    'JSON Formatter': { en: name, ar: 'منسق JSON', hi: 'JSON फ़ॉर्मेटर', bn: 'JSON ফরম্যাটার' },
    'JSON Validator': { en: name, ar: 'مدقق JSON', hi: 'JSON वैलिडेटर', bn: 'JSON ভ্যালিডেটর' },
    'Base64 Encoder': { en: name, ar: 'ترميز Base64', hi: 'Base64 एन्कोडर', bn: 'Base64 এনকোডার' },
    'Base64 Decoder': { en: name, ar: 'فك ترميز Base64', hi: 'Base64 डिकोडर', bn: 'Base64 ডিকোডার' },
    'URL Encoder': { en: name, ar: 'ترميز URL', hi: 'URL एन्कोडर', bn: 'URL এনকোডার' },
    'URL Decoder': { en: name, ar: 'فك ترميز URL', hi: 'URL डिकोडर', bn: 'URL ডিকোডার' },
    'Word Counter': { en: name, ar: 'عداد الكلمات', hi: 'शब्द गणक', bn: 'শব্দ গণক' },
    'Keyword Density Checker': { en: name, ar: 'فاحص كثافة الكلمات المفتاحية', hi: 'कीवर्ड घनत्व जाँचकर्ता', bn: 'কীওয়ার্ড ঘনত্ব পরীক্ষক' },
    'Meta Title Generator': { en: name, ar: 'مولد عنوان SEO', hi: 'मेटा शीर्षक जनरेटर', bn: 'মেটা শিরোনাম জেনারেটর' },
    'Meta Description Generator': { en: name, ar: 'مولد وصف SEO', hi: 'मेटा विवरण जनरेटर', bn: 'মেটা বিবরণ জেনারেটর' },
  };
  return known[name]?.[locale] ?? name;
}
function testProcessor(kind: string) {
  const testList = cases[kind];
  if (!testList) return [{ id: 'processor-tests', passed: false, message: 'No dedicated regression tests are defined for this processor.' }];
  return testList.map((test, index) => {
    try {
      const output = runTool(kind, test.input, test.extra ?? '');
      const passed = typeof output === 'string' && output.length > 0 && (!test.includes || output.includes(test.includes)) && (!test.pattern || test.pattern.test(output));
      return { id: `processor-test-${index + 1}`, passed, message: passed ? 'Processor returned the expected result.' : 'Processor output did not match the expected result.' };
    } catch {
      return { id: `processor-test-${index + 1}`, passed: false, message: 'Processor threw an exception during the test.' };
    }
  });
}
export function buildFactoryManifest(signal: KeywordSignal): { blueprint: ToolBlueprint; manifest: FactoryToolManifest } | null {
  const blueprint = buildKeywordBlueprint(signal);
  if (!blueprint?.supported) return null;
  if (!tools.some((tool) => tool.kind === blueprint.kind)) return null;
  const checks = [
    { id: 'reviewed-processor', passed: true, message: 'Uses an existing registered processor.' },
    { id: 'no-generated-code', passed: true, message: 'No arbitrary code is generated or evaluated.' },
    { id: 'seo-metadata', passed: blueprint.name.length > 0 && blueprint.description.length <= 160, message: 'SEO title and description fit the configured limits.' },
    ...testProcessor(blueprint.kind),
  ];
  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const passed = checks.every((check) => check.passed);
  const hasExtra = ['density', 'discount', 'percentage'].includes(blueprint.kind);
  const title = (locale: FactoryLocale) => localizedTitle(blueprint.name, locale);
  const manifest: FactoryToolManifest = {
    id: blueprint.slug, name: blueprint.name, slug: blueprint.slug, description: blueprint.description,
    category: blueprint.category, keywords: blueprint.keywords.map((keyword) => keyword.slice(0, 60)), kind: blueprint.kind, version: 1, status: 'review',
    inputs: [
      { id: 'input', type: 'textarea', required: true, label: labels.input, placeholder: { en: 'Enter text or a value…', ar: 'أدخل النص أو القيمة…', hi: 'टेक्स्ट या मान दर्ज करें…', bn: 'লেখা বা মান লিখুন…' } },
      ...(hasExtra ? [{ id: 'extra' as const, type: 'text' as const, required: blueprint.kind !== 'density', label: labels.extra, placeholder: { en: 'Enter an additional value…', ar: 'أدخل قيمة إضافية…', hi: 'अतिरिक्त मान दर्ज करें…', bn: 'একটি অতিরিক্ত মান লিখুন…' } }] : []),
    ],
    output: { type: 'text', label: labels.output, copyable: true },
    seo: { title: `${blueprint.name} | FreeToolForge`.slice(0, 70), description: `${intros.en} ${blueprint.name}.`.slice(0, 170) },
    localizedSeo: Object.fromEntries((['en', 'ar', 'hi', 'bn'] as FactoryLocale[]).map((locale) => [locale, {
      title: `${title(locale)} | FreeToolForge`.slice(0, 70),
      description: `${intros[locale]} ${title(locale)}.`.slice(0, 170),
    }])) as FactoryToolManifest['localizedSeo'],
    faq: [],
    examples: (() => {
      const input = blueprint.kind === 'discount' ? '100' : blueprint.kind === 'percentage' ? '200' : blueprint.kind === 'jsonFormat' ? '{"name":"Ada"}' : blueprint.kind === 'jsonValidate' ? '{"ok":true}' : 'Sample input';
      const extra = blueprint.kind === 'discount' ? '20' : blueprint.kind === 'percentage' ? '10' : blueprint.kind === 'density' ? 'sample' : '';
      return [{ input, output: runTool(blueprint.kind, input, extra) }];
    })(),
    instructions: steps.en,
    localizedContent: Object.fromEntries((['en', 'ar', 'hi', 'bn'] as FactoryLocale[]).map((locale) => [locale, {
      intro: `${intros[locale]} ${title(locale)}.`, howTo: steps[locale],
    }])) as FactoryToolManifest['localizedContent'],
    safety: { processor: 'reviewed-built-in', arbitraryCode: false, networkAccess: false, fileAccess: false },
    quality: { score, passed, checks },
  };
  return { blueprint, manifest };
}
