import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sakhi-hub-secret-key-2026'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Define route protections
  const isAdminLoginPage = pathname === '/admin/login';
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || isAdminLoginPage;
  const isAdminPage = pathname.startsWith('/admin') && !isAdminLoginPage;
  const isVendorPage = pathname.startsWith('/vendor');
  const isVendorApi = pathname.startsWith('/api/vendor');
  const isSubVendorPage = pathname.startsWith('/sub-vendor');
  const isEmployeePage = pathname.startsWith('/employee');
  const isMemberPage = pathname.startsWith('/member');
  const isPublicPage = !isAdminPage && !isVendorPage && !isSubVendorPage && !isEmployeePage && !isMemberPage && !isAuthPage;

  // 1. Allow public pages
  if (isPublicPage || pathname === '/' || pathname.startsWith('/api/public') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 2. Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET);
      
      // Strict Role & Status Redirects
      if (payload.role === 'super_admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      
      if (payload.role === 'vendor') {
        const dest = payload.dashboardAccess ? '/vendor/dashboard' : '/vendor/onboarding';
        return NextResponse.redirect(new URL(dest, request.url));
      }
      
      if (payload.role === 'sub_vendor') return NextResponse.redirect(new URL(payload.status === 'active' ? '/sub-vendor/dashboard' : '/pending-approval', request.url));
      if (payload.role === 'employee') return NextResponse.redirect(new URL(payload.status === 'active' ? '/employee/dashboard' : '/pending-approval', request.url));
      if (payload.role === 'member') return NextResponse.redirect(new URL(payload.status === 'active' ? '/member/dashboard' : '/pending-assignment', request.url));
    } catch (e) {
      return NextResponse.next();
    }
  }

  // 3. Protect dashboard routes
  if (isAdminPage || isVendorPage || isVendorApi || isSubVendorPage || isEmployeePage || isMemberPage) {
    if (!token) {
      if (isVendorApi) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url));
    }

    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET);
      
      // VENDOR STRICT ACCESS CONTROL
      if (payload.role === 'vendor') {
        // API Protection
        if (isVendorApi && !payload.dashboardAccess && pathname !== '/api/vendor/documents') {
          return NextResponse.json({ success: false, message: 'Verification Required. Dashboard access blocked.' }, { status: 403 });
        }

        // Page Protection
        if (isVendorPage) {
          // If they don't have explicit dashboard access, they are locked to onboarding
          if (!payload.dashboardAccess && pathname !== '/vendor/onboarding') {
            return NextResponse.redirect(new URL('/vendor/onboarding', request.url));
          }
          // If they HAVE dashboard access, don't let them go back to onboarding unnecessarily
          if (payload.dashboardAccess && pathname === '/vendor/onboarding') {
            return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
          }
        }
      }

      // SUB-VENDOR STRICT ACCESS CONTROL
      if (payload.role === 'sub_vendor') {
        // API Protection (can reuse vendor API for documents)
        if (isVendorApi && !payload.dashboardAccess && pathname !== '/api/vendor/documents') {
          return NextResponse.json({ success: false, message: 'Verification Required. Dashboard access blocked.' }, { status: 403 });
        }

        // Page Protection
        if (isSubVendorPage) {
          if (!payload.dashboardAccess && pathname !== '/sub-vendor/onboarding') {
            return NextResponse.redirect(new URL('/sub-vendor/onboarding', request.url));
          }
          if (payload.dashboardAccess && pathname === '/sub-vendor/onboarding') {
            return NextResponse.redirect(new URL('/sub-vendor/dashboard', request.url));
          }
        }
      }

      // EMPLOYEE / MEMBER PROTECTION
      if (payload.role !== 'super_admin' && payload.role !== 'vendor' && payload.role !== 'sub_vendor' && !['active', 'approved'].includes(payload.status)) {
        if (pathname !== '/pending-approval' && pathname !== '/pending-assignment') {
          return NextResponse.redirect(new URL('/pending-approval', request.url));
        }
      }

      // Hierarchy check (Option C)
      if (!['super_admin', 'vendor', 'sub_vendor'].includes(payload.role) && payload.assignmentStatus === 'pending') {
        if (pathname !== '/pending-assignment' && pathname !== '/pending-approval') {
          return NextResponse.redirect(new URL('/pending-assignment', request.url));
        }
      }

      // Role-based access control (RBAC)
      if (isAdminPage && payload.role !== 'super_admin') return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isVendorPage && payload.role !== 'vendor' && payload.role !== 'super_admin') return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isSubVendorPage && !['sub_vendor', 'vendor', 'super_admin'].includes(payload.role)) return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isEmployeePage && !['employee', 'sub_vendor', 'vendor', 'super_admin'].includes(payload.role)) return NextResponse.redirect(new URL('/unauthorized', request.url));
      if (isMemberPage && !['member', 'employee', 'sub_vendor', 'vendor', 'super_admin'].includes(payload.role)) return NextResponse.redirect(new URL('/unauthorized', request.url));

    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Handle Landing Pages for Restricted Statuses
  if (pathname === '/pending-approval' || pathname === '/pending-assignment') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET);
      
      // If user is now active and assigned, redirect them out of the waiting room
      if (payload.status === 'active' || payload.status === 'approved') {
         if (payload.role === 'vendor' && !payload.dashboardAccess) {
            return NextResponse.redirect(new URL('/vendor/onboarding', request.url));
         }
         if (payload.role === 'sub_vendor' && !payload.dashboardAccess) {
            return NextResponse.redirect(new URL('/sub-vendor/onboarding', request.url));
         }
         // Redirect to their respective dashboards
         const dashMap: any = {
           super_admin: '/admin/dashboard',
           vendor: '/vendor/dashboard',
           sub_vendor: '/sub-vendor/dashboard',
           employee: '/employee/dashboard',
           member: '/member/dashboard'
         };
         return NextResponse.redirect(new URL(dashMap[payload.role] || '/', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/:path*',
    '/vendor/onboarding',
    '/sub-vendor/onboarding',
    '/api/vendor/:path*',
    '/sub-vendor/:path*',
    '/employee/:path*',
    '/member/:path*',
    '/login',
    '/register',
    '/pending-approval',
    '/pending-assignment',
  ],
};
