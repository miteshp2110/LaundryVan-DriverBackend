function getOtp() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp;
}

function getDriverOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

module.exports = { getOtp, getDriverOtp };
