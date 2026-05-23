require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { calculateRoomBill } = require('./utils/billCalculator');
const { validateBillInput } = require('./utils/billValidator');
const {
  validateTenantInput,
  isPrismaUniqueIdCardError,
} = require('./utils/tenantValidator');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middlewares/authMiddleware');

const prisma = new PrismaClient({});
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Test API
app.get('/', (req, res) => {
  res.send('API Quản lý phòng trọ is running');
});

// Auth API (public)
app.use('/api/auth', authRoutes);

// Protected management APIs
app.use('/api/rooms', authMiddleware);
app.use('/api/tenants', authMiddleware);
app.use('/api/bills', authMiddleware);
app.use('/api/dashboard', authMiddleware);

// Rooms API
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, rentPrice, serviceFee } = req.body;
    const room = await prisma.room.create({
      data: { name, rentPrice, serviceFee }
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rentPrice, serviceFee, status } = req.body;
    const room = await prisma.room.update({
      where: { id: Number(id) },
      data: { name, rentPrice, serviceFee, status }
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({ where: { id: Number(id) } });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenants API
app.get('/api/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({ include: { room: true } });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tenants', async (req, res) => {
  try {
    const { fullName, birthYear, hometown, idCard, phone, roomId } = req.body;

    const validation = validateTenantInput(
      { fullName, birthYear, hometown, idCard, phone, roomId },
      { isCreate: true }
    );

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
      });
    }

    const { parsed } = validation;
    const tenant = await prisma.tenant.create({
      data: {
        fullName: parsed.fullName,
        birthYear: parsed.birthYear,
        hometown: parsed.hometown,
        idCard: parsed.idCard,
        phone: parsed.phone,
        roomId: parsed.roomId ?? null,
      },
    });
    if (parsed.roomId) {
      await prisma.room.update({
        where: { id: parsed.roomId },
        data: { status: 'Đã thuê' },
      });
    }
    res.json(tenant);
  } catch (err) {
    if (isPrismaUniqueIdCardError(err)) {
      return res.status(409).json({
        success: false,
        message: 'Căn cước công dân này đã tồn tại.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, birthYear, hometown, idCard, phone, roomId } = req.body;

    const validation = validateTenantInput({
      fullName,
      birthYear,
      hometown,
      idCard,
      phone,
      roomId,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
      });
    }

    const { parsed } = validation;
    const updateData = {};
    if (parsed.fullName !== undefined) updateData.fullName = parsed.fullName;
    if (parsed.birthYear !== undefined) updateData.birthYear = parsed.birthYear;
    if (parsed.hometown !== undefined) updateData.hometown = parsed.hometown;
    if (parsed.idCard !== undefined) updateData.idCard = parsed.idCard;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (parsed.roomId !== undefined) {
      updateData.roomId = parsed.roomId;
    } else if (roomId === null || roomId === '') {
      updateData.roomId = null;
    }

    const tenant = await prisma.tenant.update({
      where: { id: Number(id) },
      data: updateData,
    });
    if (parsed.roomId) {
      await prisma.room.update({
        where: { id: parsed.roomId },
        data: { status: 'Đã thuê' },
      });
    }
    res.json(tenant);
  } catch (err) {
    if (isPrismaUniqueIdCardError(err)) {
      return res.status(409).json({
        success: false,
        message: 'Căn cước công dân này đã tồn tại.',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { id: Number(id) }});
    await prisma.tenant.delete({ where: { id: Number(id) } });
    if (tenant?.roomId) {
      const remainingTenants = await prisma.tenant.findMany({ where: { roomId: tenant.roomId }});
      if (remainingTenants.length === 0) {
        await prisma.room.update({ where: { id: tenant.roomId }, data: { status: 'Trống' } });
      }
    }
    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Bills API
app.get('/api/bills', async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    const bills = await prisma.monthlyBill.findMany({ where, include: { room: true } });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const {
      roomId,
      month,
      year,
      electricityOld,
      electricityNew,
      waterOld,
      waterNew,
      electricityPrice,
      waterPrice,
      status,
    } = req.body;

    const validation = validateBillInput({
      roomId,
      month,
      year,
      electricityOld,
      electricityNew,
      waterOld,
      waterNew,
      electricityPrice,
      waterPrice,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
      });
    }

    const parsed = validation.parsed;

    const room = await prisma.room.findUnique({ where: { id: parsed.roomId } });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Phòng không tồn tại',
      });
    }

    const existingBill = await prisma.monthlyBill.findUnique({
      where: {
        roomId_month_year: {
          roomId: parsed.roomId,
          month: parsed.month,
          year: parsed.year,
        },
      },
    });

    if (existingBill) {
      return res.status(409).json({
        success: false,
        message: 'Hóa đơn cho phòng này trong tháng/năm đã tồn tại',
      });
    }

    const billCalculation = calculateRoomBill({
      rentPrice: room.rentPrice,
      serviceFee: room.serviceFee,
      electricityOld: parsed.electricityOld,
      electricityNew: parsed.electricityNew,
      electricityPrice: parsed.electricityPrice,
      waterOld: parsed.waterOld,
      waterNew: parsed.waterNew,
      waterPrice: parsed.waterPrice,
    });

    const billStatus =
      status === 'Đã thanh toán' ? 'Đã thanh toán' : 'Chưa thanh toán';

    const bill = await prisma.monthlyBill.create({
      data: {
        roomId: parsed.roomId,
        month: parsed.month,
        year: parsed.year,
        electricityOld: parsed.electricityOld,
        electricityNew: parsed.electricityNew,
        waterOld: parsed.waterOld,
        waterNew: parsed.waterNew,
        electricityPrice: parsed.electricityPrice,
        waterPrice: parsed.waterPrice,
        electricityUsage: billCalculation.electricityUsage,
        electricityAmount: billCalculation.electricityAmount,
        waterUsage: billCalculation.waterUsage,
        waterAmount: billCalculation.waterAmount,
        totalAmount: billCalculation.totalAmount,
        status: billStatus,
      },
      include: { room: true },
    });

    const response = {
      success: true,
      message: 'Tạo hóa đơn thành công',
      data: bill,
    };

    if (validation.warnings.length > 0) {
      response.warnings = validation.warnings;
    }

    res.status(201).json(response);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Hóa đơn cho phòng này trong tháng/năm đã tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.put('/api/bills/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Chưa thanh toán', 'Đã thanh toán'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status phải là "Chưa thanh toán" hoặc "Đã thanh toán"',
      });
    }

    const bill = await prisma.monthlyBill.update({
      where: { id: Number(id) },
      data: { status },
      include: { room: true },
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái hóa đơn thành công',
      data: bill,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Hóa đơn không tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
