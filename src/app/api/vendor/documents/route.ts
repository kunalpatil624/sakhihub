import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/utils/response';
import { uploadToCloudinary } from '@/lib/cloudinary';

const getUserModel = async () => (await import('@/models/User')).default as any;

// GET — Fetch the vendor's own documents from User.documents
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !['vendor', 'sub_vendor'].includes((session as any).role)) {
      return errorResponse('Unauthorized', 401);
    }

    await dbConnect();
    const UserModel = await getUserModel();
    const query: any[] = [{ _id: (session as any).id }];

    if ((session as any).mobile) {
      query.push({ mobile: (session as any).mobile });
    }

    const user = await UserModel.findOne({
      role: { $in: ['vendor', 'sub_vendor'] },
      $or: query,
    }).select('documents status fullName email vendorCode');
    if (!user) return errorResponse('User not found', 404);

    // Return documents map plus user status info
    return successResponse({
      documents: user.documents || {},
      status: user.status,
      fullName: user.fullName,
      email: user.email,
      vendorCode: user.vendorCode,
    }, 'Documents fetched successfully');
  } catch (error: any) {
    console.error('Fetch Vendor Documents Error:', error);
    return errorResponse(error.message || 'Failed to fetch documents', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !['vendor', 'sub_vendor'].includes((session as any).role)) {
      return errorResponse('Unauthorized', 401);
    }

    await dbConnect();
    const body = await req.json();
    const { file, type, fileName, fileSize, mimeType } = body;

    if (!file || !type) {
      return errorResponse('Missing file or document type', 400);
    }

    const UserModel = await getUserModel();
    const query: any[] = [{ _id: (session as any).id }];

    if ((session as any).mobile) {
      query.push({ mobile: (session as any).mobile });
    }

    const user = await UserModel.findOne({
      role: { $in: ['vendor', 'sub_vendor'] },
      $or: query,
    });
    if (!user) return errorResponse('User not found', 404);

    const isVendor = user.role === 'vendor';
    const isSubVendor = user.role === 'sub_vendor';

    const allowedTypes = isVendor 
      ? ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook']
      : ['panCard', 'aadhaarCard', 'bankPassbook'];

    if (!allowedTypes.includes(type)) {
      return errorResponse(`Invalid document type for ${user.role}: ${type}`, 400);
    }

    // Strict PDF Validation (Backend)
    if (!file.startsWith('data:application/pdf;base64,')) {
      return errorResponse('Invalid file type. Only PDF documents are allowed.', 400);
    }

    // Dynamic folder structure: sakhihub/{role}s/{email}/{type}
    const roleFolder = isVendor ? 'vendors' : 'sub-vendors';
    const folder = `${roleFolder}/${(user.email || user._id.toString()).replace(/[@.]/g, '_')}`;
    
    // Upload to Cloudinary with explicit PDF handling
    const uploadResult = await uploadToCloudinary(file, folder);

    console.log('Cloudinary Upload Result:', {
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
      secure_url: uploadResult.secure_url
    });

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error("Failed to get URL from Cloudinary");
    }

    // Update user document info
    if (!user.documents) {
      user.documents = {};
    }

    const docEntry = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: fileName || `${type}.pdf`,
      fileSize,
      mimeType: mimeType || 'application/pdf',
      vendorId: user._id.toString(),
      vendorEmail: user.email || '',
      status: 'uploaded' as const,
      remarks: '',
      uploadedAt: new Date(),
      reviewedAt: undefined
    };

    console.log(`Saving Document Entry for ${type}:`, JSON.stringify(docEntry, null, 2));

    // Use Mongoose's internal method to update the nested object reliably
    (user.documents as any)[type] = docEntry;
    
    // Explicitly mark the documents path as modified
    user.markModified('documents');

    // Auto-update overall status if all required docs are now present
    const requiredDocs = isVendor 
      ? ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook']
      : ['panCard', 'aadhaarCard', 'bankPassbook'];
      
    const allUploaded = requiredDocs.every(t => (user.documents as any)?.[t]?.url);
    
    if (allUploaded && ['pending', 'reupload_required'].includes(user.status)) {
      user.status = 'documents_uploaded';
    }

    // Detailed logging of the state before save
    console.log('Final User State before save:', JSON.stringify({
      id: user._id,
      status: user.status,
      documents: Object.keys(user.documents || {}).map(k => ({ type: k, status: (user.documents as any)[k]?.status }))
    }, null, 2));

    await user.save({ validateModifiedOnly: true });
    console.log(`Document ${type} saved successfully for user ${user._id}`);

    const finalUser = await UserModel.findById(user._id).select('-password');
    return successResponse(finalUser, 'Document uploaded and reference saved successfully');

  } catch (error: any) {
    console.error('Vendor Document Upload Error:', error);
    
    // Detailed error logging for validation issues
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      console.error('Validation Details:', messages);
      return errorResponse(`Validation Failed: ${messages.join(', ')}`, 400);
    }

    return errorResponse(error.message || 'Upload failed', 500);
  }
}
