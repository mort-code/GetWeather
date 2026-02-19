# GetWeather (via Open-Meteo)

A robust Google Apps Script that adds a custom `=GET_WEATHER(location, date)` function to Google Sheets. It automatically fetches both historical weather data and future forecasts using the free [Open-Meteo API](https://open-meteo.com/).

## Features
* **Smart API Routing:** Automatically switches between Open-Meteo's Historical Archive and Forecast APIs based on the requested date.
* **Geocoding Built-in:** Accepts Zip Codes (e.g., "10001") or City/Country strings (e.g., "Sapporo, Japan").
* **Rate-Limit Protections:** Includes exponential backoff/retry logic and API request jitter to prevent "Thundering Herd" errors when loading multiple rows.
* **Caching:** Caches responses for 6 hours to drastically reduce API calls and speed up sheet loading times.
* **WMO Formatting:** Translates standard WMO weather codes into human-readable text with emojis (e.g., "☔ Rain: Heavy").

---

## File Breakdown & Usage

This project includes two different script files depending on how you want to structure your Google Sheets.

### 1. `GetWeather.gs` (The Engine)
This is the core script containing the fetch logic, caching, and WMO formatting. 

**When to use it:** Use this file if you are only running the weather function in a **single, standalone Google Sheet**.
1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Paste the contents of `GetWeather.gs` and save.
4. Use the formula `=GET_WEATHER("10001", "2024-01-01")` directly in your sheet.

### 2. `ImportGetWeather.gs` (The Wrapper)
If you want to use the weather formula across **multiple different Google Sheets**, you should deploy `GetWeather.gs` as an Apps Script Library to avoid copying and pasting the main code everywhere. `ImportGetWeather.gs` acts as a lightweight bridge to that central library.

**How to set it up:**
1. In your "Master" sheet containing `GetWeather.gs`, go to **Project Settings** (gear icon) and copy the **Script ID**.
2. Deploy the Master script as a Library (**Deploy > New Deployment > Library**).
3. Open your "New" sheet, go to **Extensions > Apps Script**, and click the **+** next to **Libraries**.
4. Paste the Script ID, look it up, and save it with the Identifier `WeatherLib`.
5. Paste the contents of `ImportGetWeather.gs` into the new sheet's script editor and save.
6. You can now use the `=GET_WEATHER()` formula in the new sheet, and it will route through your centralized Master script.

---

## Formula Examples

The custom function requires two arguments: `Location` and `Date`.

**Valid Location Formats:**
* Zip Code: `"90210"`
* City and Country: `"Madrid, Spain"`

**Valid Date Formats:**
* ISO Format String: `"2024-05-20"`
* Cell Reference containing a valid Date object: `B2`

**Example:**
```excel
=GET_WEATHER("10001", "2023-12-25")
