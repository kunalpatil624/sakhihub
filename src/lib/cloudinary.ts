import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileUri: string, folder: string, options: any = {}) => {
  try {
    const isPDF = fileUri.startsWith('data:application/pdf');
    
    // For PDFs, we enforce resource_type 'raw' to avoid Cloudinary's image 
    // processing pipeline which blocks PDF viewing on many free accounts.
    let finalPublicId = options.public_id;
    if (isPDF && !finalPublicId) {
      // Must append .pdf in public_id for 'raw' files so Cloudinary recognizes the type
      finalPublicId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
    }

    const uploadOptions = {
      invalidate: true,
      resource_type: isPDF ? "raw" : "auto",
      folder: `sakhihub/${folder}`,
      ...(finalPublicId ? { public_id: finalPublicId } : {}),
      ...options
    };

    const result = await cloudinary.uploader.upload(fileUri, uploadOptions);
    
    // Ensure PDFs have the .pdf extension in the URL
    if (isPDF && !result.secure_url.toLowerCase().endsWith('.pdf')) {
      result.secure_url = result.secure_url + '.pdf';
    }
    
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default cloudinary;
