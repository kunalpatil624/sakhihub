import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAuthSession } from '@/lib/auth';
import { errorResponse, successResponse } from '@/utils/response';
import User from '@/models/User';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { 
  REQUIRED_DOCS_BY_ROLE, 
  getDocumentFolderPath 
} from '@/lib/docs/service';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { file, type, fileName, fileSize, mimeType } = await req.json();

    if (!file || !type) {
      return errorResponse('Missing required fields', 400);
    }

    await dbConnect();
    const user = await User.findById((session as any).id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const allowedTypes = REQUIRED_DOCS_BY_ROLE[user.role as keyof typeof REQUIRED_DOCS_BY_ROLE] || [];

    if (!allowedTypes.includes(type)) {
      return errorResponse('Invalid document type for this role', 400);
    }

    // Folder path: sakhihub/[role]s/[email_slug]
    const folder = getDocumentFolderPath(user);

    const uploadResult = await uploadToCloudinary(file, {
      folder,
      public_id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      resource_type: 'raw',
    });

    if (!uploadResult) {
      return errorResponse('Cloudinary upload failed', 500);
    }

    // Initialize documents object if it doesn't exist
    if (!user.documents) {
      user.documents = {};
    }

    user.documents[type] = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: fileName || `${type}.pdf`,
      fileSize: fileSize || 'Unknown',
      mimeType: mimeType || 'application/pdf',
      status: 'uploaded',
      uploadedAt: new Date(),
    };

    // Update global status if needed (from pending to documents_uploaded)
    const requiredDocs = REQUIRED_DOCS_BY_ROLE[user.role as keyof typeof REQUIRED_DOCS_BY_ROLE] || [];
    const uploadedDocs = Object.keys(user.documents).filter(key => !!user.documents[key].url);
    
    if (user.status === 'pending' && requiredDocs.every(doc => uploadedDocs.includes(doc))) {
      user.status = 'documents_uploaded';
    }

    user.markModified('documents');
    await user.save();

    return successResponse({
      message: 'Document uploaded successfully',
      document: user.documents[type],
      status: user.status
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    await dbConnect();
    const user = await User.findById((session as any).id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      documents: user.documents || {},
      status: user.status
    });

  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
