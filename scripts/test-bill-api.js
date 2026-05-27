/**
 * Kiểm thử POST /api/bills (chạy khi server đang listen).
 * Usage: node scripts/test-bill-api.js [baseUrl] [roomId]
 * Mặc định: http://localhost:5000/api, roomId=1
 */
const BASE = process.argv[2] || 'http://localhost:5000/api';
const ROOM_ID = Number(process.argv[3] || 1);

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

  const month = 11;
  const year = new Date().getFullYear();

  let roomId = ROOM_ID;
  const roomCheck = await request('GET', '/rooms');
  const rooms = Array.isArray(roomCheck.data) ? roomCheck.data : [];
  const testRoom = rooms.find((r) => r.rentPrice === 2000000 && r.serviceFee === 50000);
  if (testRoom) {
    roomId = testRoom.id;
  } else {
    const created = await request('POST', '/rooms', {
      name: `TEST_BILL_${Date.now()}`,
      rentPrice: 2000000,
      serviceFee: 50000,
    });
    if (!created.data?.id) {
      console.error('Không tạo được phòng test:', created.status, created.data);
      process.exit(1);
    }
    roomId = created.data.id;
  }

  // ensure room has at least 2 tenants for PER_PERSON case
  const tenants = await request('GET', '/tenants');
  const has2Tenants =
    Array.isArray(tenants.data) &&
    tenants.data.filter((t) => t.roomId === roomId).length >= 2;
  if (!has2Tenants) {
    const suffix = Date.now().toString().slice(-8);
    await request('POST', '/tenants', {
      fullName: 'Test Tenant A',
      birthYear: 1995,
      hometown: 'Hà Nội',
      idCard: `0790000000${suffix.slice(0, 2)}`,
      phone: '0987654321',
      roomId,
    });
    await request('POST', '/tenants', {
      fullName: 'Test Tenant B',
      birthYear: 1996,
      hometown: 'Hà Nội',
      idCard: `0790000000${suffix.slice(2, 4)}`,
      phone: '0912345678',
      roomId,
    });
  }

  const basePayload = {
    roomId,
    month,
    year,
    electricityOld: 1111,
    electricityNew: 2222,
    waterOld: 10,
    waterNew: 20,
    electricityPrice: 3500,
    waterPrice: 15000,
    totalAmount: 1,
  };

  console.log('Case 1: tạo bill METER hợp lệ, backend tự tính (ignore totalAmount frontend)');
  const c1 = await request('POST', '/bills', basePayload);
  const bill = c1.data?.data;
  const ok1 =
    c1.status === 201 &&
    c1.data?.success === true &&
    bill?.electricityUsage === 1111 &&
    bill?.electricityAmount === 3888500 &&
    bill?.waterUsage === 10 &&
    bill?.waterAmount === 150000 &&
    bill?.totalAmount === 6088500;
  console.log(ok1 ? 'PASS' : 'FAIL', c1.status, bill);

  console.log('Case 2: electricityNew < electricityOld');
  const c2 = await request('POST', '/bills', {
    ...basePayload,
    month: month === 12 ? 10 : month + 1,
    electricityOld: 100,
    electricityNew: 50,
  });
  const ok2 = c2.status === 400 && c2.data?.success === false;
  console.log(ok2 ? 'PASS' : 'FAIL', c2.status, c2.data?.message);

  console.log('Case 3: waterNew < waterOld (METER)');
  const c3 = await request('POST', '/bills', {
    ...basePayload,
    month: month <= 10 ? 12 : month - 1,
    electricityOld: 10,
    electricityNew: 20,
    waterOld: 10,
    waterNew: 5,
  });
  const ok3 = c3.status === 400 && c3.data?.success === false;
  console.log(ok3 ? 'PASS' : 'FAIL', c3.status, c3.data?.message);

  console.log('Case 4: waterBillingType PER_PERSON, waterPrice 100000, waterPeopleCount 2 -> waterAmount 200000');
  const c4 = await request('POST', '/bills', {
    roomId,
    month: month <= 9 ? month + 3 : month - 3,
    year,
    electricityOld: 10,
    electricityNew: 20,
    electricityPrice: 3500,
    waterBillingType: 'PER_PERSON',
    waterPrice: 100000,
    waterPeopleCount: 2,
    totalAmount: 0,
  });
  const bill4 = c4.data?.data;
  const ok4 =
    c4.status === 201 &&
    c4.data?.success === true &&
    bill4?.waterBillingType === 'PER_PERSON' &&
    bill4?.waterPeopleCount === 2 &&
    bill4?.waterAmount === 200000;
  console.log(ok4 ? 'PASS' : 'FAIL', c4.status, bill4);

  console.log('Case 5: trùng roomId/month/year');
  const c5 = await request('POST', '/bills', basePayload);
  const ok5 = c5.status === 409 && c5.data?.success === false;
  console.log(ok5 ? 'PASS' : 'FAIL', c5.status, c5.data?.message);

  if (!ok1 || !ok2 || !ok3 || !ok4 || !ok5) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
