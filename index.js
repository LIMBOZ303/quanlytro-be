require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({});
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Test API
app.get('/', (req, res) => {
  res.send('API Quản lý phòng trọ is running');
});

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
    const tenant = await prisma.tenant.create({
      data: { fullName, birthYear: Number(birthYear), hometown, idCard, phone, roomId: roomId ? Number(roomId) : null }
    });
    if (roomId) {
      await prisma.room.update({ where: { id: Number(roomId) }, data: { status: 'Đã thuê' } });
    }
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, birthYear, hometown, idCard, phone, roomId } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: Number(id) },
      data: { fullName, birthYear: Number(birthYear), hometown, idCard, phone, roomId: roomId ? Number(roomId) : null }
    });
    if (roomId) {
      await prisma.room.update({ where: { id: Number(roomId) }, data: { status: 'Đã thuê' } });
    }
    res.json(tenant);
  } catch (err) {
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
    const { roomId, month, year, electricityOld, electricityNew, waterOld, waterNew, electricityPrice, waterPrice } = req.body;
    
    const room = await prisma.room.findUnique({ where: { id: Number(roomId) } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const totalAmount = (electricityNew - electricityOld) * electricityPrice + 
                        (waterNew - waterOld) * waterPrice + 
                        room.rentPrice + 
                        room.serviceFee;

    const bill = await prisma.monthlyBill.create({
      data: {
        roomId: Number(roomId),
        month: Number(month),
        year: Number(year),
        electricityOld: Number(electricityOld),
        electricityNew: Number(electricityNew),
        waterOld: Number(waterOld),
        waterNew: Number(waterNew),
        electricityPrice: Number(electricityPrice),
        waterPrice: Number(waterPrice),
        totalAmount,
      }
    });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bills/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bill = await prisma.monthlyBill.update({
      where: { id: Number(id) },
      data: { status }
    });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
