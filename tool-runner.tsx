'use client';
import { useState } from 'react';
import type { ToolDef } from '@/lib/tool-engine/registry';
import { runTool } from '@/lib/tool-engine/registry';
import { getToolFields } from '@/lib/tool-renderer';
import type { Locale } from '@/lib/i18n';
import { getUI, localizeToolResult } from '@/lib/i18n/ui';
export default function ToolRunner({ tool, locale = 'en' }: { tool: ToolDef; locale?: Locale }) {
 const [input,setInput]=useState('');const [extra,setExtra]=useState('');const [output,setOutput]=useState('');const fields=getToolFields(tool);const labels=getUI(locale).tool;
 return <div className="panel toolbox"><label className="field-label">{labels.input}</label><textarea className="field textarea" value={input} onChange={e=>setInput(e.target.value)} placeholder={labels.inputHint} rows={7} maxLength={100000}/>{fields.secondaryLabel&&<><label className="field-label" style={{marginTop:14}}>{labels.extra}</label><input className="field" value={extra} onChange={e=>setExtra(e.target.value)} placeholder={labels.extraHint} maxLength={10000}/></>}<div className="actions"><button className="btn" onClick={()=>setOutput(localizeToolResult(tool.kind,runTool(tool.kind,input,extra),locale))}>{labels.run}</button><button className="btn secondary" onClick={()=>{setInput('');setExtra('');setOutput('');}}>{labels.clear}</button></div>{output!==''&&<section className="output-wrap"><div className="output-head"><b>{labels.result}</b><button className="btn secondary" onClick={()=>void navigator.clipboard.writeText(output)}>{labels.copy}</button></div><pre className="output">{output}</pre></section>}</div>;
}
