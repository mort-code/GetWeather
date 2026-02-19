/**
 * Imports weather with Caching and Rate-limit handling.
 * Prevents hitting API limits by storing results for 6 hours.
 *
 * @param {string} location Input Zip Code OR "City, Country".
 * @param {date} dateInput The date cell.
 * @return {string} High/Low temp, Precip, and Weather Condition.
 * @customfunction
 */
function GET_WEATHER(location, dateInput) {
  if (!location || !dateInput) return "Missing Input";
  if (dateInput === "#REF!" || dateInput === "#N/A") return "Fix Date Cell";

  // --- STEP 1: Process Inputs ---
  var dateStr;
  if (Object.prototype.toString.call(dateInput) === '[object Date]') {
    var year = dateInput.getFullYear();
    var month = (dateInput.getMonth() + 1).toString().padStart(2, '0');
    var day = dateInput.getDate().toString().padStart(2, '0');
    dateStr = year + "-" + month + "-" + day;
  } else {
    dateStr = dateInput.toString().trim();
  }
  var searchChat = location.toString();

  // --- STEP 2: Check Cache (The "Anti-Quota" Fix) ---
  // We create a unique ID for this request (e.g., "10001-2023-01-01")
  var cache = CacheService.getScriptCache();
  var cacheKey = searchChat.replace(/\s/g, "") + "-" + dateStr; 
  var cachedResult = cache.get(cacheKey);

  // If we have the answer in memory, return it immediately (0 API calls used)
  if (cachedResult != null) {
    return cachedResult;
  }

  // --- STEP 3: API Calls (Only runs if not in cache) ---
  Utilities.sleep(Math.random() * 2000); // Small jitter for concurrency

  try {
// --- Helper: WMO Codes with Emojis ---
    function getWeatherDescription(code) {
      var codes = {
        0: "☀️ Clear Sky", 
        1: "🌤️ Mainly Clear", 2: "⛅ Partly Cloudy", 3: "☁️ Overcast",
        45: "🌫️ Fog", 48: "🌫️ Rime Fog",
        51: "🌧️ Drizzle", 53: "🌧️ Drizzle", 55: "🌧️ Drizzle",
        56: "❄️ Freezing Drizzle", 57: "❄️ Freezing Drizzle",
        61: "☔ Rain: Slight", 63: "☔ Rain: Mod", 65: "☔ Rain: Heavy",
        66: "❄️ Freezing Rain", 67: "❄️ Freezing Rain",
        71: "🌨️ Snow: Slight", 73: "🌨️ Snow: Mod", 75: "🌨️ Snow: Heavy", 
        77: "🌨️ Snow Grains",
        80: "🌦️ Showers", 81: "🌦️ Showers", 82: "⛈️ Violent Showers",
        85: "🌨️ Snow Showers", 86: "🌨️ Snow Showers",
        95: "⛈️ Thunderstorm", 96: "⛈️ Thunderstorm/Hail", 99: "⛈️ Heavy Thunderstorm"
      };
      return codes[code] || "❓ Unknown (" + code + ")";
    }

    // Helper: Retry Logic
    function fetchWithRetry(url) {
      var maxRetries = 3;
      for (var i = 0; i < maxRetries; i++) {
        try {
          return UrlFetchApp.fetch(url);
        } catch (e) {
          if (i === maxRetries - 1) throw e;
          Utilities.sleep(2000);
        }
      }
    }

    // Geocoding
    var geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + 
                 encodeURIComponent(searchChat) + "&count=1&limit=1";
    var geoResponse = fetchWithRetry(geoUrl);
    var geoData = JSON.parse(geoResponse.getContentText());

    if (!geoData.results || geoData.results.length === 0) return "Error: Location Not Found";

    var lat = geoData.results[0].latitude;
    var lng = geoData.results[0].longitude;

    // Determine URL
    var inputDateObj = new Date(dateStr);
    var today = new Date();
    today.setHours(0,0,0,0); 
    var baseUrl = (inputDateObj < today) ? 
      "https://archive-api.open-meteo.com/v1/archive" : 
      "https://api.open-meteo.com/v1/forecast";

    // Fetch Weather
    var weatherUrl = baseUrl + "?" +
                     "latitude=" + lat + 
                     "&longitude=" + lng + 
                     "&start_date=" + dateStr + 
                     "&end_date=" + dateStr + 
                     "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code" +
                     "&temperature_unit=fahrenheit" + 
                     "&wind_speed_unit=mph" + 
                     "&precipitation_unit=inch" +
                     "&timezone=auto";

    var weatherResponse = fetchWithRetry(weatherUrl);
    var weatherData = JSON.parse(weatherResponse.getContentText());

    if (!weatherData.daily || !weatherData.daily.time || weatherData.daily.time.length === 0) {
      return "No Data for " + dateStr;
    }

    var maxTemp = weatherData.daily.temperature_2m_max[0];
    var minTemp = weatherData.daily.temperature_2m_min[0];
    var precip = weatherData.daily.precipitation_sum[0];
    var code = weatherData.daily.weather_code[0];
    var condition = getWeatherDescription(code);

    if (maxTemp === null || maxTemp === undefined) return "No Data Available";

    var resultString = "High: " + maxTemp + "°F | Low: " + minTemp + "°F | Precip: " + precip + "in | " + condition;

    // --- STEP 4: Save to Cache ---
    // Store this result for 6 hours (21600 seconds)
    cache.put(cacheKey, resultString, 21600);

    return resultString;

  } catch (e) {
    return "Error: " + e.message;
  }
}
