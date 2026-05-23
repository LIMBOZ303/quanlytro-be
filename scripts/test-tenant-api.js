/**
 * Kiểm thử POST/PUT /api/tenants (server phải đang chạy).
 * Usage: node scripts/test-tenant-api.js [baseUrl]
 * Mặc định: http://localhost:5000/api
 */
const BASE = process.argv[2] || 'http://localhost:5000/api';

let authToken = '';

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function validPayload(overrides = {}) {
  const suffix = Date.now().toString().slice(-8);
  return {
    fullName: 'Nguyễn Văn Test',
    birthYear: 1995,
    hometown: 'Hà Nội',
    idCard: `0012345678${suffix.slice(0, 2)}`,
    phone: '0987654321',
    ...overrides,
  };
}

async function login() {
  const res = await request('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123',
  });
  authToken = res.data?.data?.token || '';
  if (!authToken) {
    console.error('Đăng nhập thất bại:', res.status, res.data);
    process.exit(1);
  }
}

async function main() {
  await login();

  console.log('Case 1: POST phone sai');
  const c1 = await request('POST', '/tenants', validPayload({ phone: '12345' }));
  const ok1 =
    c1.status === 400 &&
    c1.data?.success === false &&
    c1.data?.message?.includes('Số điện thoại');
  console.log(ok1 ? 'PASS' : 'FAIL', c1.status, c1.data?.message);

  console.log('Case 2: POST CCCD sai');
  const c2 = await request('POST', '/tenants', validPayload({ idCard: '123' }));
  const ok2 =
    c2.status === 400 &&
    c2.data?.success === false &&
    c2.data?.message?.includes('Căn cước công dân');
  console.log(ok2 ? 'PASS' : 'FAIL', c2.status, c2.data?.message);

  console.log('Case 3: POST khách hợp lệ');
  const payload = validPayload({
    phone: '0912345678',
    idCard: `0791234567${Date.now().toString().slice(-2)}`,
  });
  const c3 = await request('POST', '/tenants', payload);
  const tenant = c3.data;
  const ok3 =
    c3.status === 200 &&
    tenant?.id &&
    tenant.phone === '0912345678' &&
    tenant.idCard === payload.idCard;
  console.log(ok3 ? 'PASS' : 'FAIL', c3.status, tenant?.id);

  if (!tenant?.id) {
    console.error('Không tạo được khách test, dừng các case PUT');
    process.exit(1);
  }

  console.log('Case 4: PUT phone sai');
  const c4 = await request('PUT', `/tenants/${tenant.id}`, {
    ...payload,
    phone: '84912345678',
  });
  const ok4 =
    c4.status === 400 &&
    c4.data?.success === false &&
    c4.data?.message?.includes('Số điện thoại');
  console.log(ok4 ? 'PASS' : 'FAIL', c4.status, c4.data?.message);

  console.log('Case 5: PUT khách hợp lệ');
  const c5 = await request('PUT', `/tenants/${tenant.id}`, {
    ...payload,
    phone: '0321234567',
    fullName: 'Nguyễn Văn Test Updated',
  });
  const ok5 =
    c5.status === 200 &&
    c5.data?.phone === '0321234567' &&
    c5.data?.fullName === 'Nguyễn Văn Test Updated';
  console.log(ok5 ? 'PASS' : 'FAIL', c5.status, c5.data?.phone);

  await request('DELETE', `/tenants/${tenant.id}`);

  if (!ok1 || !ok2 || !ok3 || !ok4 || !ok5) process.exit(1);
  console.log('Tất cả test tenant PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
