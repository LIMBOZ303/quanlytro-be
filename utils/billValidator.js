const ELECTRICITY_PRICE_WARNING_THRESHOLD = 10000;
const WATER_PRICE_WARNING_THRESHOLD = 100000;
const MIN_YEAR = 2000;

function validateBillInput(data) {
  const errors = [];
  const warnings = [];

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
  } = data;

  if (roomId === undefined || roomId === null || roomId === '') {
    errors.push('roomId là bắt buộc');
  } else if (Number.isNaN(Number(roomId))) {
    errors.push('roomId không hợp lệ');
  }

  const monthNum = Number(month);
  if (month === undefined || month === null || month === '') {
    errors.push('month là bắt buộc');
  } else if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    errors.push('month phải nằm trong khoảng từ 1 đến 12');
  }

  const yearNum = Number(year);
  const maxYear = new Date().getFullYear() + 1;
  if (year === undefined || year === null || year === '') {
    errors.push('year là bắt buộc');
  } else if (
    Number.isNaN(yearNum) ||
    !Number.isInteger(yearNum) ||
    yearNum < MIN_YEAR ||
    yearNum > maxYear
  ) {
    errors.push(`year phải là số nguyên hợp lệ từ ${MIN_YEAR} đến ${maxYear}`);
  }

  const electricityOldNum = Number(electricityOld);
  const electricityNewNum = Number(electricityNew);
  if (
    electricityOld === undefined ||
    electricityOld === null ||
    electricityOld === '' ||
    Number.isNaN(electricityOldNum)
  ) {
    errors.push('electricityOld là bắt buộc');
  }
  if (
    electricityNew === undefined ||
    electricityNew === null ||
    electricityNew === '' ||
    Number.isNaN(electricityNewNum)
  ) {
    errors.push('electricityNew là bắt buộc');
  }
  if (
    !Number.isNaN(electricityOldNum) &&
    !Number.isNaN(electricityNewNum) &&
    electricityNewNum < electricityOldNum
  ) {
    errors.push('Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ');
  }

  const waterOldNum = Number(waterOld);
  const waterNewNum = Number(waterNew);
  if (
    waterOld === undefined ||
    waterOld === null ||
    waterOld === '' ||
    Number.isNaN(waterOldNum)
  ) {
    errors.push('waterOld là bắt buộc');
  }
  if (
    waterNew === undefined ||
    waterNew === null ||
    waterNew === '' ||
    Number.isNaN(waterNewNum)
  ) {
    errors.push('waterNew là bắt buộc');
  }
  if (
    !Number.isNaN(waterOldNum) &&
    !Number.isNaN(waterNewNum) &&
    waterNewNum < waterOldNum
  ) {
    errors.push('Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ');
  }

  const electricityPriceNum = Number(electricityPrice);
  if (
    electricityPrice === undefined ||
    electricityPrice === null ||
    electricityPrice === '' ||
    Number.isNaN(electricityPriceNum)
  ) {
    errors.push('electricityPrice là bắt buộc');
  } else if (electricityPriceNum < 0) {
    errors.push('electricityPrice phải lớn hơn hoặc bằng 0');
  } else if (electricityPriceNum > ELECTRICITY_PRICE_WARNING_THRESHOLD) {
    warnings.push('Đơn giá điện có vẻ quá cao, vui lòng kiểm tra lại');
  }

  const waterPriceNum = Number(waterPrice);
  if (
    waterPrice === undefined ||
    waterPrice === null ||
    waterPrice === '' ||
    Number.isNaN(waterPriceNum)
  ) {
    errors.push('waterPrice là bắt buộc');
  } else if (waterPriceNum < 0) {
    errors.push('waterPrice phải lớn hơn hoặc bằng 0');
  } else if (waterPriceNum > WATER_PRICE_WARNING_THRESHOLD) {
    warnings.push('Đơn giá nước có vẻ quá cao, vui lòng kiểm tra lại');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsed: {
      roomId: Number(roomId),
      month: monthNum,
      year: yearNum,
      electricityOld: electricityOldNum,
      electricityNew: electricityNewNum,
      waterOld: waterOldNum,
      waterNew: waterNewNum,
      electricityPrice: electricityPriceNum,
      waterPrice: waterPriceNum,
    },
  };
}

module.exports = {
  validateBillInput,
  ELECTRICITY_PRICE_WARNING_THRESHOLD,
  WATER_PRICE_WARNING_THRESHOLD,
};
