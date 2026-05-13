/**
 * Returns a proxy URL for viewing PDFs with correct Content-Type headers.
 * Solves Cloudinary raw resource delivery issues where PDFs are served
 * as application/octet-stream instead of application/pdf.
 */
export function getDocumentViewUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';
  return `/api/documents/view?url=${encodeURIComponent(url)}`;
}

/**
 * Check if a document entry has valid uploaded file data.
 * Handles incomplete records like { status: 'uploaded' } without url/publicId.
 */
export function isDocumentUploaded(docInfo: any): boolean {
  return !!(docInfo && typeof docInfo.url === 'string' && docInfo.url.trim() !== '');
}
