function calculateElectricityFixed(oldNumber, newNumber, unitPrice) {
  const usage = newNumber - oldNumber;
  const amount = usage * unitPrice;
  return { usage, amount };
}

function calculateWaterByMeter(oldNumber, newNumber, unitPrice) {
  const usage = newNumber - oldNumber;
  const amount = usage * unitPrice;
  return { usage, amount };
}

function calculateRoomBill({
  rentPrice,
  serviceFee,
  electricityOld,
  electricityNew,
  electricityPrice,
  waterOld,
  waterNew,
  waterPrice,
}) {
  const electricity = calculateElectricityFixed(electricityOld, electricityNew, electricityPrice);
  const water = calculateWaterByMeter(waterOld, waterNew, waterPrice);

  const totalAmount =
    rentPrice + serviceFee + electricity.amount + water.amount;

  return {
    electricityUsage: electricity.usage,
    electricityAmount: electricity.amount,
    waterUsage: water.usage,
    waterAmount: water.amount,
    totalAmount,
  };
}

module.exports = {
  calculateElectricityFixed,
  calculateWaterByMeter,
  calculateRoomBill,
};
