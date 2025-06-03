// FIX YEAR IN DATE
// This is a workaround for the fact that Javascript
// will misinterpret 'yyyy' dates before 1848
// So, for example:
// new Date(Date.parse('1847')).getFullYear() = 1846!
// Fix is to force by appending a month:
// new Date(Date.parse('Jan 1847')).getFullYear() = 1847
// Returns a fixed date object
// eslint-disable-next-line import/no-anonymous-default-export
export default function(date) {
  // If date is just year, append 'Jan'
  if (!isNaN(date)) {
    date = date.toString();
    if (date.length === 4) {
      // Year as 'yyyy' -- force!
      date = `January 1 ${date}`;
    }
  }
  return new Date(date);
}
