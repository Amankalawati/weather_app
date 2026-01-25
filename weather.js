const API_KEY = '045faff4a4afbe11b3cef9a1fee7405e'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const errorMessage = document.getElementById('error-message');
const currentWeather = document.getElementById('current-weather');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const weatherIcon = document.getElementById('weather-icon');
const forecast = document.getElementById('forecast');
const forecastContainer = document.querySelector('.forecast-container');

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    } else {
        showError('Please enter a city name.');
    }
});

async function getWeather(city) {
    try {
        const currentRes = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if (!currentRes.ok) throw new Error('City not found');
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        if (!forecastRes.ok) throw new Error('Forecast not available');
        const forecastData = await forecastRes.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateBackground(currentData.weather[0].main);
        hideError();
        showSections();
    } catch (error) {
        showError(error.message);
        hideSections();
    }
}

function displayCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `Temperature: ${Math.round(data.main.temp)}°C`;
    description.textContent = `Condition: ${data.weather[0].description}`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} m/s`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = data.list.filter(item => item.dt_txt.endsWith('12:00:00')); // Midday forecasts for 5 days
    dailyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        const desc = item.weather[0].description;

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.innerHTML = `
            <p>${date}</p>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}">
            <p>${temp}°C</p>
            <p>${desc}</p>
        `;
        forecastContainer.appendChild(forecastItem);
    });
}

function updateBackground(condition) {
    document.body.className = ''; // Reset classes
    if (condition.toLowerCase().includes('clear')) {
        document.body.classList.add('sunny');
    } else if (condition.toLowerCase().includes('cloud')) {
        document.body.classList.add('cloudy');
    } else if (condition.toLowerCase().includes('rain')) {
        document.body.classList.add('rainy');
    } else if (condition.toLowerCase().includes('snow')) {
        document.body.classList.add('snowy');
    }
    // Fallback to default if no match
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}

function showSections() {
    currentWeather.classList.remove('hidden');
    forecast.classList.remove('hidden');
}

function hideSections() {
    currentWeather.classList.add('hidden');
    forecast.classList.add('hidden');
}

// Initial hide
hideSections();