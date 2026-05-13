import { NextRequest, NextResponse } from 'next/server';

/**
 * PDF Document Proxy
 * Fetches a PDF from Cloudinary and serves it with correct Content-Type headers.
 * This fixes the "Failed to load PDF document" error caused by Cloudinary's
 * raw resource type serving files with application/octet-stream.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, message: 'URL parameter is required' }, { status: 400 });
  }

  // Security: Only allow Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) {
    return NextResponse.json({ success: false, message: 'Invalid document URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Failed to fetch document: ${response.status}` },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('Document proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load document' },
      { status: 500 }
    );
  }
}
