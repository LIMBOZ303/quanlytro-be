const VIETNAM_PHONE_REGEX = /^0\d{9}$/;
const CITIZEN_ID_REGEX = /^\d{12}$/;
const MIN_BIRTH_YEAR = 1900;

const PHONE_ERROR_MESSAGE =
  'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số và bắt đầu bằng 0.';
const CITIZEN_ID_ERROR_MESSAGE =
  'Căn cước công dân không hợp lệ. Vui lòng nhập đúng 12 chữ số.';

function validateVietnamPhone(phone) {
  if (phone === undefined || phone === null || phone === '') {
    return { valid: false, message: PHONE_ERROR_MESSAGE };
  }
  const value = String(phone).trim();
  if (!VIETNAM_PHONE_REGEX.test(value)) {
    return { valid: false, message: PHONE_ERROR_MESSAGE };
  }
  return { valid: true, value };
}

function validateCitizenId(idCard) {
  if (idCard === undefined || idCard === null || idCard === '') {
    return { valid: false, message: CITIZEN_ID_ERROR_MESSAGE };
  }
  const value = String(idCard).trim();
  if (!CITIZEN_ID_REGEX.test(value)) {
    return { valid: false, message: CITIZEN_ID_ERROR_MESSAGE };
  }
  return { valid: true, value };
}

function validateTenantInput(data, options = {}) {
  const { isCreate = false } = options;
  const errors = [];
  const parsed = {};

  const { fullName, birthYear, hometown, idCard, phone, roomId } = data;

  if (isCreate || fullName !== undefined) {
    if (
      fullName === undefined ||
      fullName === null ||
      typeof fullName !== 'string' ||
      !fullName.trim()
    ) {
      errors.push('Họ tên không được để trống');
    } else {
      parsed.fullName = fullName.trim();
    }
  }

  if (isCreate || phone !== undefined) {
    const phoneResult = validateVietnamPhone(phone);
    if (!phoneResult.valid) {
      errors.push(phoneResult.message);
    } else {
      parsed.phone = phoneResult.value;
    }
  }

  if (isCreate || idCard !== undefined) {
    const idCardResult = validateCitizenId(idCard);
    if (!idCardResult.valid) {
      errors.push(idCardResult.message);
    } else {
      parsed.idCard = idCardResult.value;
    }
  }

  const hasBirthYear =
    birthYear !== undefined && birthYear !== null && birthYear !== '';
  if (hasBirthYear) {
    const birthYearNum = Number(birthYear);
    const maxBirthYear = new Date().getFullYear();
    if (
      Number.isNaN(birthYearNum) ||
      !Number.isInteger(birthYearNum) ||
      birthYearNum < MIN_BIRTH_YEAR ||
      birthYearNum > maxBirthYear
    ) {
      errors.push(
        `Năm sinh phải là số nguyên hợp lệ từ ${MIN_BIRTH_YEAR} đến ${maxBirthYear}`
      );
    } else {
      parsed.birthYear = birthYearNum;
    }
  } else if (isCreate) {
    errors.push('Năm sinh là bắt buộc');
  }

  const hasHometown =
    hometown !== undefined && hometown !== null && hometown !== '';
  if (hasHometown) {
    if (typeof hometown !== 'string' || !hometown.trim()) {
      errors.push('Quê quán không được để trống');
    } else {
      parsed.hometown = hometown.trim();
    }
  } else if (isCreate) {
    errors.push('Quê quán là bắt buộc');
  }

  if (roomId !== undefined && roomId !== null && roomId !== '') {
    const roomIdNum = Number(roomId);
    if (Number.isNaN(roomIdNum)) {
      errors.push('roomId không hợp lệ');
    } else {
      parsed.roomId = roomIdNum;
    }
  } else if (isCreate) {
    parsed.roomId = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed,
  };
}

function isPrismaUniqueIdCardError(err) {
  if (err?.code !== 'P2002') return false;
  const target = err.meta?.target;
  if (!target) return true;
  if (Array.isArray(target)) return target.includes('idCard');
  return target === 'idCard';
}

module.exports = {
  validateVietnamPhone,
  validateCitizenId,
  validateTenantInput,
  isPrismaUniqueIdCardError,
  PHONE_ERROR_MESSAGE,
  CITIZEN_ID_ERROR_MESSAGE,
};
