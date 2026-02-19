/**
 * Connects to the GetWeather Library.
 *
 * @param {string} location Zip Code or City.
 * @param {date} date The date to check.
 * @return The weather from the master script.
 * @customfunction
 */
function GET_WEATHER(location, date) {
  return GetWeather.GET_WEATHER(location, date);
}
