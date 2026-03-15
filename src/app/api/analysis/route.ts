import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId, title, summary, category, threat_level, country_codes } = body

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 600,
        system: `You are a senior geopolitical intelligence analyst. Provide concise, structured threat assessments. 
        Focus on: immediate implications, regional dynamics, escalation risks, and key actors. 
        Write in professional intelligence briefing style. Be direct and analytical, not speculative.
        Keep responses under 400 words.`,
        messages: [{
          role: 'user',
          content: `Analyze the following geopolitical event:

TITLE: ${title}
CATEGORY: ${category}
THREAT LEVEL: ${threat_level}
COUNTRIES: ${country_codes?.join(', ')}
SUMMARY: ${summary}

Provide a structured intelligence assessment covering:
1. Situation Overview
2. Key Actors & Interests
3. Immediate Implications
4. Escalation Risk Assessment
5. Strategic Outlook (30-90 days)`
        }]
      })
    })

    const data = await response.json()
    const analysis = data.content?.[0]?.text || 'Analysis unavailable.'

    // Save analysis back to the event
    if (eventId) {
      const supabase = await createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('events') as any).update({ ai_analysis: analysis }).eq('id', eventId)
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
