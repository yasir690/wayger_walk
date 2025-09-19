const generateOtpExpiry = (minutes = 2) => {
  console.log(Date.now());

  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = generateOtpExpiry;
