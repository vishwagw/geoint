import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { report_type, focus } = await req.json()

    // Fetch recent events for context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: events } = await (supabase.from('events') as any)
      .select('title, summary, category, threat_level, country_codes, published_at')
      .order('published_at', { ascending: false })
      .limit(20) as { data: Array<{ threat_level: string; title: string; category: string; country_codes: string[] }> | null }

    const eventContext = events?.map(e =>
      `[${e.threat_level.toUpperCase()}] ${e.title} (${e.category}, ${e.country_codes?.join('/')})`
    ).join('\n') || 'No recent events available.'

    const reportPrompts: Record<string, string> = {
      briefing: `Generate a daily intelligence briefing based on the most recent geopolitical events. Cover the top developments, regional hotspots, and key trends.`,
      summary: `Generate a comprehensive regional summary analyzing the current geopolitical landscape. Identify patterns, interconnections, and emerging dynamics.`,
      deep_dive: `Generate a deep-dive analysis examining the root causes, key actors, and long-term implications of the current most critical situation.`,
      forecast: `Generate a strategic forecast analyzing geopolitical trends and projecting likely developments over the next 30-90 days. Include probability assessments.`,
    }

    const systemPrompt = `You are a senior geopolitical intelligence analyst producing professional intelligence reports. 
    Write in a structured, authoritative tone. Use clear headers (marked with #). 
    Be analytical, precise, and evidence-based. Avoid speculation without basis.
    Format: Use markdown-style headers (#, ##) for sections. Use bullet points (- ) for lists.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `${reportPrompts[report_type] || reportPrompts.briefing}

${focus ? `ANALYST FOCUS: ${focus}\n\n` : ''}RECENT EVENTS CONTEXT:
${eventContext}

Generate a comprehensive intelligence report. Include an executive summary, detailed analysis sections, and a strategic assessment. Date: ${new Date().toUTCString()}`
        }]
      })
    })

    const data = await response.json()
    const content = data.content?.[0]?.text || 'Report generation failed.'

    // Extract title from first line
    const lines = content.split('\n')
    const titleLine = lines.find((l: string) => l.startsWith('# '))
    const title = titleLine ? titleLine.slice(2).trim() : `${report_type.toUpperCase()} — ${new Date().toLocaleDateString()}`

    // Save report
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: report } = await (supabase.from('reports') as any).insert({
      user_id: user.id,
      title,
      content,
      report_type,
      country_codes: [],
      event_ids: [],
    }).select().single()

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
