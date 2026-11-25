export type TemplateEntry={slug:string;title:string;category:string;description:string;variables:string[];content:string};
export const templates:TemplateEntry[]=[
{slug:'seo-content-brief',title:'SEO Content Brief',category:'SEO',description:'Brief an article writer with intent, audience, structure, and keyword notes.',variables:['topic','audience','primary_keyword','secondary_keywords','search_intent','tone'],content:`# Content Brief: {{topic}}

**Audience:** {{audience}}
**Primary keyword:** {{primary_keyword}}
**Secondary keywords:** {{secondary_keywords}}
**Search intent:** {{search_intent}}
**Tone:** {{tone}}

## Recommended outline
1. Introduction: define the reader problem and promise
2. Main section: explain the core topic with practical steps
3. Supporting section: answer common questions and edge cases
4. Conclusion: summarize and offer a relevant next step

## Editorial notes
- Match the search intent; avoid filler.
- Use examples, evidence, and original insights.
- Add helpful FAQs only when they answer real questions.`},
{slug:'product-description',title:'Product Description',category:'E-commerce',description:'Reusable product description with features, benefits, and call to action.',variables:['product_name','product_type','target_customer','key_features','tone','cta'],content:`# {{product_name}}

Meet {{product_name}}, designed for {{target_customer}} who need {{product_type}} that fits their needs.

## Why it stands out
{{key_features}}

**Writing tone:** {{tone}}

Choose {{product_name}} for a practical combination of value and usability.

**{{cta}}**`},
{slug:'newsletter',title:'Newsletter',category:'Email',description:'An adaptable newsletter format for updates, lessons, and announcements.',variables:['newsletter_name','audience','main_update','useful_tip','link','signoff'],content:`Subject: {{newsletter_name}} — a quick update

Hello {{audience}},

## This week
{{main_update}}

## One useful tip
{{useful_tip}}

Read more: {{link}}

{{signoff}}`},
{slug:'outreach-email',title:'Outreach Email',category:'Business',description:'Personalized, concise outreach with a clear value proposition.',variables:['recipient_name','personalization','offer','proof','next_step','sender_name'],content:`Subject: A quick idea for {{recipient_name}}

Hi {{recipient_name}},

{{personalization}}

I wanted to share {{offer}}. {{proof}}

Would {{next_step}} be useful?

Best,
{{sender_name}}`},
{slug:'meeting-agenda',title:'Meeting Agenda',category:'Productivity',description:'Keep a meeting focused with goals, topics, owners, and decisions.',variables:['meeting_title','date','attendees','goal','topics','facilitator'],content:`# {{meeting_title}}
**Date:** {{date}}
**Attendees:** {{attendees}}
**Facilitator:** {{facilitator}}

## Goal
{{goal}}

## Agenda
{{topics}}

## Decisions
- 

## Action items
- Owner — Task — Due date`},
{slug:'social-caption',title:'Social Caption',category:'Social',description:'Caption framework for a hook, helpful point, and call to action.',variables:['platform','hook','key_message','cta','hashtags'],content:`**Platform:** {{platform}}

{{hook}}

{{key_message}}

{{cta}}

{{hashtags}}`},
{slug:'project-proposal',title:'Project Proposal',category:'Business',description:'Outline a project proposal with scope, outcomes, timing, and investment.',variables:['client','project','problem','deliverables','timeline','budget','success_metrics'],content:`# Proposal: {{project}}
**Prepared for:** {{client}}

## Challenge
{{problem}}

## Proposed work
{{deliverables}}

## Timeline
{{timeline}}

## Investment
{{budget}}

## Success metrics
{{success_metrics}}`},
{slug:'video-script',title:'Video Script',category:'Creator',description:'Structure a video with a hook, key beats, and a close.',variables:['topic','audience','hook','points','cta','style'],content:`# Video: {{topic}}
**Audience:** {{audience}} | **Style:** {{style}}

## Hook (0–10 sec)
{{hook}}

## Main beats
{{points}}

## Close
{{cta}}`}
];
export function getTemplate(slug:string){return templates.find(t=>t.slug===slug)}
