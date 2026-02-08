 const getCairoTimestampForFile = () => {
  const cairoDate = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })
  );

  const pad = (n) => n.toString().padStart(2, '0');

  return `${cairoDate.getFullYear()}-${pad(cairoDate.getMonth() + 1)}-${pad(cairoDate.getDate())}_` +
         `${pad(cairoDate.getHours())}-${pad(cairoDate.getMinutes())}-${pad(cairoDate.getSeconds())}`;
};
const getCairoDate = () => {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })
  );
};
module.exports = {
  getCairoDate,
  getCairoTimestampForFile
};

