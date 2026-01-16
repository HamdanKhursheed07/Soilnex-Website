// ----------- SAMPLE PAST WEEK DATA (You can replace with ESP32 API later) -----------

const humidityWeek = [
  { day: "Mon", date: "2026-01-12", value: 55, status: "Normal" },
  { day: "Tue", date: "2026-01-13", value: 62, status: "Good" },
  { day: "Wed", date: "2026-01-14", value: 71, status: "High" },
  { day: "Thu", date: "2026-01-15", value: 48, status: "Normal" },
  { day: "Fri", date: "2026-01-16", value: 65, status: "Good" },
  { day: "Sat", date: "2026-01-17", value: 78, status: "High" },
  { day: "Sun", date: "2026-01-18", value: 59, status: "Normal" },
];

const raindropWeek = [
  { day: "Mon", date: "2026-01-12", value: 920, status: "No Rain" },
  { day: "Tue", date: "2026-01-13", value: 880, status: "No Rain" },
  { day: "Wed", date: "2026-01-14", value: 610, status: "Light Rain" },
  { day: "Thu", date: "2026-01-15", value: 540, status: "Rain" },
  { day: "Fri", date: "2026-01-16", value: 760, status: "No Rain" },
  { day: "Sat", date: "2026-01-17", value: 490, status: "Rain" },
  { day: "Sun", date: "2026-01-18", value: 950, status: "No Rain" },
];

// Soil Moisture: Higher value means dryer soil (common for analog sensors)
const moistureWeek = [
  { day: "Mon", date: "2026-01-12", value: 520, status: "Moist" },
  { day: "Tue", date: "2026-01-13", value: 610, status: "Normal" },
  { day: "Wed", date: "2026-01-14", value: 735, status: "Dry" },
  { day: "Thu", date: "2026-01-15", value: 490, status: "Wet" },
  { day: "Fri", date: "2026-01-16", value: 680, status: "Normal" },
  { day: "Sat", date: "2026-01-17", value: 790, status: "Dry" },
  { day: "Sun", date: "2026-01-18", value: 560, status: "Moist" },
];

// ------------------- Table Renderer -------------------

function renderTable(tableId, data, unitText){
  const tbody = document.getElementById(tableId);
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.day}</td>
      <td>${item.date}</td>
      <td>${item.value} ${unitText}</td>
      <td>${item.status}</td>
    `;

    tbody.appendChild(tr);
  });
}

function getLatestValue(data){
  return data[data.length - 1];
}

// ------------------- LIVE + PAST 7 DAYS WEATHER (REAL DATA) -------------------
// Uses Open-Meteo (No API key needed)

function weatherCodeToText(code){
  const map = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Rain Showers (Slight)",
    81: "Rain Showers (Moderate)",
    82: "Rain Showers (Violent)",
    95: "Thunderstorm",
  };
  return map[code] || `Weather Code: ${code}`;
}

function getUserLocation(callback){
  const locEl = document.getElementById("weatherLocation");
  if(!navigator.geolocation){
    if(locEl) locEl.innerText = "Geolocation not supported";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      if(locEl) locEl.innerText = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
      callback(lat, lon);
    },
    () => {
      if(locEl) locEl.innerText = "Location permission denied ❌";
    }
  );
}

// ✅ LIVE WEATHER
async function loadWeather(){
  const timeEl = document.getElementById("weatherTime");

  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("humidity");
  const windEl = document.getElementById("wind");
  const rainEl = document.getElementById("rain");
  const statusEl = document.getElementById("status");

  if(!tempEl) return; // run only on weather.html

  if(timeEl) timeEl.innerText = "--";

  getUserLocation(async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&timezone=auto`;

    try{
      const res = await fetch(url);
      const data = await res.json();

      const current = data.current;

      tempEl.innerText = `${current.temperature_2m} °C`;
      humEl.innerText = `${current.relative_humidity_2m} %`;
      windEl.innerText = `${current.wind_speed_10m} m/s`;
      rainEl.innerText = `${current.rain} mm`;
      statusEl.innerText = weatherCodeToText(current.weather_code);

      if(timeEl) timeEl.innerText = current.time;
    }catch(err){
      console.log(err);
    }
  });
}

// ✅ PAST 7 DAYS WEATHER TABLE
async function loadPastWeekWeather(){
  const tableBody = document.getElementById("pastWeatherTable");
  if(!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="5">Loading past 7 days data...</td></tr>`;

  getUserLocation(async (lat, lon) => {
    // past_days=7 gives last 7 days
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&past_days=7&timezone=auto`;

    try{
      const res = await fetch(url);
      const data = await res.json();

      const dates = data.daily.time;
      const maxT = data.daily.temperature_2m_max;
      const minT = data.daily.temperature_2m_min;
      const rainSum = data.daily.precipitation_sum;

      tableBody.innerHTML = "";

      for(let i=0; i<dates.length; i++){
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i+1}</td>
          <td>${dates[i]}</td>
          <td>${maxT[i]} °C</td>
          <td>${minT[i]} °C</td>
          <td>${rainSum[i]} mm</td>
        `;
        tableBody.appendChild(tr);
      }

    }catch(err){
      tableBody.innerHTML = `<tr><td colspan="5">Failed to load data ❌</td></tr>`;
      console.log(err);
    }
  });
}
