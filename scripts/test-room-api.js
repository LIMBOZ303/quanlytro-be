/**
 * Kiểm thử POST /api/rooms trùng tên (server phải đang chạy).
 * Usage: node scripts/test-room-api.js [baseUrl]
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

  const name = `TEST_ROOM_DUP_${Date.now()}`;
  console.log('Case 1: tạo phòng lần 1');
  const c1 = await request('POST', '/rooms', {
    name,
    rentPrice: 2000000,
    serviceFee: 50000,
  });
  const ok1 = c1.status === 200 && c1.data?.id && c1.data?.name === name;
  console.log(ok1 ? 'PASS' : 'FAIL', c1.status, c1.data);

  console.log('Case 2: tạo phòng trùng tên -> 409 message thân thiện');
  const c2 = await request('POST', '/rooms', {
    name,
    rentPrice: 2000000,
    serviceFee: 50000,
  });
  const ok2 =
    c2.status === 409 &&
    c2.data?.success === false &&
    c2.data?.message === 'Tên phòng này đã tồn tại. Vui lòng chọn tên phòng khác.';
  console.log(ok2 ? 'PASS' : 'FAIL', c2.status, c2.data);

  if (!ok1 || !ok2) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

