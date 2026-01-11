import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/mysql';
import { createAuditLog, extractClientInfo } from '@/lib/services/audit';
import { User } from '@/lib/types/database';

export const GET = requireRole(['admin', 'super_admin'])(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10')); // حماية من طلبات كبيرة جداً
    const offset = (page - 1) * limit;

    // Filters
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let whereConditions = ['tenant_id = ?'];
    const params: any[] = [request.user!.tenantId];

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // جلب البيانات وعدد النتائج في نفس الوقت
    const [users, countResult] = await Promise.all([
      query<User[]>(
        // LIMIT و OFFSET تم دمجهم مباشرة بعد التحقق من كونهم أرقام
        `SELECT id, tenant_id, email, phone, first_name, last_name, role, status,
                avatar_url, last_login_at, created_at, updated_at
         FROM users
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query<{ total: number }[]>(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        params
      ),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total: countResult[0]?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
});
