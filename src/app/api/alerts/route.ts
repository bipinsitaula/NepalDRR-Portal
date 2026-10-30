import { NextResponse } from 'next/server';
import { SEED_ALERTS } from '@/data/seedAlerts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';
  const format = searchParams.get('format');

  let alerts = SEED_ALERTS;
  if (activeOnly) {
    alerts = alerts.filter((a) => a.isActive);
  }

  // If RSS XML format is requested
  if (format === 'rss' || format === 'xml') {
    const rssItems = alerts
      .map(
        (a) => `
    <item>
      <title><![CDATA[${a.severity.toUpperCase()}: ${a.title}]]></title>
      <description><![CDATA[${a.message} - Instructions: ${a.instruction}]]></description>
      <pubDate>${new Date(a.startsAt).toUTCString()}</pubDate>
      <guid>${a.id}</guid>
      <category>${a.hazardType}</category>
      <author>${a.issuedBy}</author>
    </item>`
      )
      .join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>NepalDRR Portal - National Disaster Emergency Warning Feed</title>
    <link>https://nepaldrr.gov.np/alerts</link>
    <description>Official multi-hazard early warning and emergency advisories for Nepal</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300'
      }
    });
  }

  // Default JSON response
  return NextResponse.json({
    status: 'success',
    count: alerts.length,
    timestamp: new Date().toISOString(),
    alerts: alerts
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: 'success',
      message: 'Alert published to national broadcast channel.',
      alertId: `alt-${Date.now()}`
    });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message }, { status: 400 });
  }
}
