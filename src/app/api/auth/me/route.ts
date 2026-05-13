import { getAuthSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/utils/response';
import dbConnect from '@/lib/mongodb';

const getUserModel = async () => (await import('@/models/User')).default as any;

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    await dbConnect();
    const sessionUser = session as any;
    const UserModel = await getUserModel();
    const user = await UserModel.findOne({
      $or: [
        { _id: sessionUser.id },
        ...(sessionUser.mobile ? [{ mobile: sessionUser.mobile }] : []),
      ],
    }).select('-password');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error) {
    return errorResponse('Internal Server Error', 500);
  }
}
