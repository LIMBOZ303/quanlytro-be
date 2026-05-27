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

function calculateWaterByPerson(numberOfPeople, pricePerPerson) {
  const usage = null;
  const amount = numberOfPeople * pricePerPerson;
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
  waterBillingType = 'METER',
  waterPeopleCount,
}) {
  const electricity = calculateElectricityFixed(electricityOld, electricityNew, electricityPrice);
  const water =
    waterBillingType === 'PER_PERSON'
      ? calculateWaterByPerson(waterPeopleCount ?? 1, waterPrice)
      : calculateWaterByMeter(waterOld, waterNew, waterPrice);

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
  calculateWaterByPerson,
  calculateRoomBill,
};
