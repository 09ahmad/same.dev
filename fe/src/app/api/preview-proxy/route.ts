// src/app/api/preview-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  const targetUrl = decodeURIComponent(url);
  
  // Return an HTML page with iframe
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Preview</title>
        <style>
          body { margin: 0; padding: 0; }
          iframe { width: 100vw; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe src="${targetUrl}" title="Preview"></iframe>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}