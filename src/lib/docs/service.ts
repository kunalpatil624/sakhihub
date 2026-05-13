/**
 * Shared Backend Document Service
 * Handles folder generation, required docs logic, and status synchronization.
 */

export const REQUIRED_DOCS_BY_ROLE: Record<string, string[]> = {
  vendor: ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'],
  sub_vendor: ['panCard', 'aadhaarCard', 'bankPassbook']
};

/**
 * Generates the Cloudinary folder path for a user
 */
export function getDocumentFolderPath(user: any): string {
  if (!user) return 'sakhihub/misc';
  const role = user.role || 'unknown';
  const isVendor = role === 'vendor';
  const roleFolder = isVendor ? 'vendors' : 'sub-vendors';
  const email = user.email || '';
  const id = user._id ? user._id.toString() : Math.random().toString(36).substring(7);
  const identifier = (email || id).replace(/[@.]/g, '_');
  return `sakhihub/${roleFolder}/${identifier}`;
}

/**
 * Checks if all required documents for a role are approved
 */
export function areAllDocsApproved(user: any): boolean {
  const required = REQUIRED_DOCS_BY_ROLE[user.role] || [];
  if (required.length === 0) return false;
  
  return required.every(type => user.documents?.[type]?.status === 'approved');
}

/**
 * Determines the overall user status based on individual document statuses
 */
export function determineUserStatus(user: any): string {
  const required = REQUIRED_DOCS_BY_ROLE[user.role] || [];
  if (!user.documents) return user.status;

  const statuses = required.map(t => user.documents?.[t]?.status);
  
  const hasRejected = statuses.includes('rejected');
  const hasReupload = statuses.includes('reupload_required');
  const allApproved = areAllDocsApproved(user);
  
  if (allApproved) return 'approved'; 
  if (hasRejected || hasReupload) return 'reupload_required';
  
  const allUploaded = required.every(t => user.documents?.[t]?.url);
  if (allUploaded) return 'documents_uploaded';
  
  return user.status; 
}
