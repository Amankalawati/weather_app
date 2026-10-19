const API_KEY = '045faff4a4afbe11b3cef9a1fee7405e'; // Replace with your actual API key

const BASE_URL = "https://api.openweathermap.org/data/2.5";

const searchForm = document.getElementById("search-form");
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const errorMessage = document.getElementById("error-message");
const loadingMessage = document.getElementById("loading-message");

const currentWeather = document.getElementById("current-weather");
const cityName = document.getElementById("city-name");
const localTime = document.getElementById("local-time");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const feelsLike = document.getElementById("feels-like");
const weatherIcon = document.getElementById("weather-icon");
const weatherLabel = document.getElementById("weather-label");

const forecast = document.getElementById("forecast");
const hourlyContainer = document.getElementById("hourly-container");
const dailyContainer = document.getElementById("daily-container");
const unitToggle = document.getElementById("unit-toggle");

let currentData = null;
let forecastData = null;
let useCelsius = true;

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    getWeather(city);
});

unitToggle.addEventListener("click", () => {
    useCelsius = !useCelsius;
    unitToggle.textContent = useCelsius ? "°C / °F" : "°F / °C";

    if (currentData && forecastData) {
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
    }
});

async function fetchWeather(endpoint, city) {
    const url = new URL(`${BASE_URL}/${endpoint}`);

    url.searchParams.set("q", city);
    url.searchParams.set("appid", API_KEY);
    url.searchParams.set("units", "metric");

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found. Check the spelling and try again.");
        }

        if (response.status === 401) {
            throw new Error("Weather API key is invalid or not activated.");
        }

        if (response.status === 429) {
            throw new Error("Weather API request limit reached. Try again later.");
        }

        throw new Error("Unable to retrieve weather data. Please try again.");
    }

    return response.json();
}

async function getWeather(city) {
    if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
        showError("Add your OpenWeatherMap API key in weather.js first.");
        return;
    }

    setLoading(true);
    hideError();

    try {
        // Fetch both endpoints together.
        const [current, upcoming] = await Promise.all([
            fetchWeather("weather", city),
            fetchWeather("forecast", city)
        ]);

        currentData = current;
        forecastData = upcoming;

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateBackground(currentData.weather[0].main, currentData.dt, currentData.timezone);

        currentWeather.classList.remove("hidden");
        forecast.classList.remove("hidden");
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function convertTemperature(celsius) {
    return useCelsius ? celsius : (celsius * 9 / 5) + 32;
}

function formatTemperature(celsius) {
    return `${Math.round(convertTemperature(celsius))}°${useCelsius ? "C" : "F"}`;
}

function displayCurrentWeather(data) {
    const condition = data.weather[0];

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = formatTemperature(data.main.temp);
    description.textContent = condition.description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    feelsLike.textContent = formatTemperature(data.main.feels_like);

    weatherLabel.textContent = condition.main;
    weatherIcon.src =
        `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
    weatherIcon.alt = condition.description;

    // Use the city's timezone offset instead of the visitor's local timezone.
    const cityDate = new Date((data.dt + data.timezone) * 1000);

    localTime.textContent = `Local time: ${cityDate.toISOString().slice(11, 16)}`;
}

function displayForecast(data) {
    renderHourly(data.list);
    renderDaily(data.list);
}

function renderHourly(list) {
    hourlyContainer.replaceChildren();

    // OpenWeatherMap's standard forecast endpoint provides 3-hour intervals.
    list.slice(0, 6).forEach((item) => {
        const date = new Date(item.dt * 1000);
        const time = date.toLocaleTimeString([], {
            hour: "numeric",
            hour12: true
        });

        const card = document.createElement("article");
        card.className = "forecast-item";

        const timeLabel = document.createElement("p");
        timeLabel.className = "forecast-time";
        timeLabel.textContent = time;

        const icon = document.createElement("img");
        icon.src = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        icon.alt = item.weather[0].description;
        icon.loading = "lazy";

        const temp = document.createElement("p");
        temp.className = "forecast-temp";
        temp.textContent = formatTemperature(item.main.temp);

        const condition = document.createElement("p");
        condition.textContent = item.weather[0].description;

        card.append(timeLabel, icon, temp, condition);
        hourlyContainer.appendChild(card);
    });
}

function renderDaily(list) {
    dailyContainer.replaceChildren();

    // Group forecast entries by calendar date in the forecast timezone.
    const timezone = currentData.timezone;

    const grouped = new Map();

    list.forEach((item) => {
        const localDate = new Date((item.dt + timezone) * 1000)
            .toISOString()
            .slice(0, 10);

        if (!grouped.has(localDate)) {
            grouped.set(localDate, []);
        }

        grouped.get(localDate).push(item);
    });

    const days = [...grouped.entries()].slice(0, 5);

    days.forEach(([dateKey, entries], index) => {
        // Pick the entry closest to midday for a representative daily forecast.
        const midday = entries.reduce((best, item) => {
            const hour = new Date((item.dt + timezone) * 1000).getUTCHours();
            const bestHour = new Date((best.dt + timezone) * 1000).getUTCHours();

            return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? item : best;
        });

        const dayDate = new Date(`${dateKey}T12:00:00Z`);
        const dayName = index === 0
            ? "Today"
            : dayDate.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC"
            });

        const row = document.createElement("article");
        row.className = "daily-item";

        const name = document.createElement("span");
        name.className = "daily-day";
        name.textContent = dayName;

        const icon = document.createElement("img");
        icon.src = `https://openweathermap.org/img/wn/${midday.weather[0].icon}.png`;
        icon.alt = midday.weather[0].description;
        icon.loading = "lazy";

        const condition = document.createElement("span");
        condition.className = "daily-condition";
        condition.textContent = midday.weather[0].description;

        const temp = document.createElement("span");
        temp.className = "daily-temp";
        temp.textContent = formatTemperature(midday.main.temp);

        row.append(name, icon, condition, temp);
        dailyContainer.appendChild(row);
    });
}

function updateBackground(condition, timestamp, timezone) {
    document.body.classList.remove(
        "default-weather", "sunny", "cloudy", "rainy", "snowy", "stormy", "night"
    );

    const value = condition.toLowerCase();

    if (value.includes("thunderstorm")) {
        document.body.classList.add("stormy");
    } else if (value.includes("rain") || value.includes("drizzle")) {
        document.body.classList.add("rainy");
    } else if (value.includes("snow")) {
        document.body.classList.add("snowy");
    } else if (value.includes("cloud") || value.includes("mist") ||
               value.includes("fog") || value.includes("haze")) {
        document.body.classList.add("cloudy");
    } else if (value.includes("clear")) {
        const localHour = new Date((timestamp + timezone) * 1000).getUTCHours();

        document.body.classList.add(
            localHour < 6 || localHour >= 18 ? "night" : "sunny"
        );
    } else {
        document.body.classList.add("default-weather");
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchBtn.textContent = isLoading ? "Loading..." : "Search";
    loadingMessage.classList.toggle("hidden", !isLoading);
}

