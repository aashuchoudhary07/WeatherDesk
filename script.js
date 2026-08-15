/* =================================
   WeatherDesk
   Weather API Controller
================================= */
const suggestions =
    document.getElementById("suggestions");

const clearSearchBtn =
    document.getElementById("clearSearchBtn");

const themeBtn =
    document.getElementById("themeBtn");

const themeIcon =
    document.getElementById("themeIcon");

const rainAlert =
    document.getElementById("rainAlert");

const rainAlertText =
    document.getElementById("rainAlertText");

const todayRainChance =
    document.getElementById("todayRainChance");

const todayRainAmount =
    document.getElementById("todayRainAmount");

const todayRainHours =
    document.getElementById("todayRainHours");

const rainForecastGrid =
    document.getElementById("rainForecastGrid");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");

const errorBox = document.getElementById("errorBox");
const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");

const weatherDashboard =
    document.getElementById("weatherDashboard");

const statusText =
    document.getElementById("statusText");

const cityName =
    document.getElementById("cityName");

const countryName =
    document.getElementById("countryName");

const updatedAt =
    document.getElementById("updatedAt");

const temperature =
    document.getElementById("temperature");

const feelsLike =
    document.getElementById("feelsLike");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const pressure =
    document.getElementById("pressure");

const visibility =
    document.getElementById("visibility");

const weatherCondition =
    document.getElementById("weatherCondition");

const weatherDescription =
    document.getElementById("weatherDescription");

const weatherIcon =
    document.getElementById("weatherIcon");

const weatherNote =
    document.getElementById("weatherNote");

const recentCities =
    document.getElementById("recentCities");

const clearHistoryBtn =
    document.getElementById("clearHistoryBtn");


/* =================================
   Search Event
================================= */

searchBtn.addEventListener("click", () => {

    const city = cityInput.value.trim();

    hideError();

    if (!city) {

        weatherDashboard.classList.add("hidden");

        showError(
            "City required",
            "Please enter a city name before searching."
        );

        setStatus("READY");

        return;
    }

    searchWeather(city);
});


/* Press Enter to Search */

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        searchBtn.click();
    }

});


/* =================================
   Main Weather Function
================================= */

async function searchWeather(city) {

    showLoading(city);

    hideError();

    weatherDashboard.classList.add("hidden");

    setStatus("SEARCHING");

    try {

        /*
         * First request:
         * Convert city name into coordinates.
         */

        const locationResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );


        if (!locationResponse.ok) {
            throw new Error(
                "Unable to contact the location service."
            );
        }


        const locationData =
            await locationResponse.json();


        /*
         * No matching city
         */

        if (
            !locationData.results ||
            locationData.results.length === 0
        ) {
            throw new Error(
                "CITY_NOT_FOUND"
            );
        }


        const location =
            locationData.results[0];


        /*
         * Coordinates received from
         * the first JSON response.
         */

        const latitude = location.latitude;
        const longitude = location.longitude;


        loadingText.textContent =
            `Loading current conditions for ${location.name}...`;


        /*
         * Second request:
         * Get actual weather information.
         */

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,visibility&daily=weather_code,precipitation_probability_max,rain_sum,precipitation_hours&forecast_days=5&timezone=auto`
        );


        if (!weatherResponse.ok) {
            throw new Error(
                "Unable to retrieve weather data."
            );
        }


        const weatherData =
            await weatherResponse.json();


        /*
         * Send the JSON data to UI.
         */

        updateWeatherUI(
            location,
            weatherData
        );


        saveRecentCity(location.name);

        renderRecentCities();

        hideLoading();

        weatherDashboard.classList.remove("hidden");

        setStatus("LIVE");

    }

    catch (error) {

        hideLoading();

        weatherDashboard.classList.add("hidden");

        setStatus("OFFLINE");

        if (error.message === "CITY_NOT_FOUND") {

            showError(
                "City not found",
                `We couldn't find weather data for "${city}". Try checking the spelling.`
            );

        } else {

            showError(
                "Weather service unavailable",
                "Please check your internet connection and try again."
            );

        }

    }

}


/* =================================
   Update Dashboard
================================= */

function updateWeatherUI(location, data) {

    const current = data.current;

    /* Location */
    cityName.textContent = location.name;
    countryName.textContent = location.country;


    /* Temperature */
    temperature.textContent =
        Math.round(current.temperature_2m);

    feelsLike.textContent =
        Math.round(current.apparent_temperature);


    /* Main metrics */
    humidity.textContent =
        current.relative_humidity_2m;

    windSpeed.textContent =
        current.wind_speed_10m;

    pressure.textContent =
        Math.round(current.surface_pressure);

    visibility.textContent =
        (current.visibility / 1000).toFixed(1);


    /* Weather condition */
    const weatherInfo =
        getWeatherInfo(current.weather_code);

    weatherCondition.textContent =
        weatherInfo.title;

    weatherDescription.textContent =
        weatherInfo.description;

    weatherIcon.textContent =
        weatherInfo.icon;


    /* Weather note */
    weatherNote.textContent =
        createWeatherNote(current);


    /* Rain forecast */
    updateRainForecast(data);


    /* Updated time */
    const time =
        new Date(current.time);

    updatedAt.textContent =
        time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
}


/* =================================
   Weather Code Converter
================================= */

function getWeatherInfo(code) {

    const weatherCodes = {

        0: {
            title: "Clear sky",
            description: "The sky is clear.",
            icon: "☀"
        },

        1: {
            title: "Mainly clear",
            description: "Mostly clear with a few clouds.",
            icon: "🌤"
        },

        2: {
            title: "Partly cloudy",
            description: "Some cloud cover across the sky.",
            icon: "⛅"
        },

        3: {
            title: "Overcast",
            description: "The sky is covered with clouds.",
            icon: "☁"
        },

        45: {
            title: "Fog",
            description: "Reduced visibility due to fog.",
            icon: "🌫"
        },

        48: {
            title: "Rime fog",
            description: "Fog with icy deposits.",
            icon: "🌫"
        },

        51: {
            title: "Light drizzle",
            description: "Light drizzle is falling.",
            icon: "🌦"
        },

        53: {
            title: "Drizzle",
            description: "Moderate drizzle is falling.",
            icon: "🌦"
        },

        55: {
            title: "Heavy drizzle",
            description: "Heavy drizzle is falling.",
            icon: "🌧"
        },

        61: {
            title: "Light rain",
            description: "Light rainfall is expected.",
            icon: "🌦"
        },

        63: {
            title: "Rain",
            description: "Moderate rainfall is occurring.",
            icon: "🌧"
        },

        65: {
            title: "Heavy rain",
            description: "Heavy rainfall is occurring.",
            icon: "🌧"
        },

        71: {
            title: "Light snow",
            description: "Light snowfall is occurring.",
            icon: "🌨"
        },

        73: {
            title: "Snow",
            description: "Moderate snowfall is occurring.",
            icon: "❄"
        },

        75: {
            title: "Heavy snow",
            description: "Heavy snowfall is occurring.",
            icon: "❄"
        },

        80: {
            title: "Rain showers",
            description: "Short periods of rainfall.",
            icon: "🌦"
        },

        81: {
            title: "Rain showers",
            description: "Moderate rain showers.",
            icon: "🌧"
        },

        82: {
            title: "Heavy showers",
            description: "Heavy rain showers.",
            icon: "⛈"
        },

        95: {
            title: "Thunderstorm",
            description: "Thunderstorms are occurring.",
            icon: "⛈"
        },

        96: {
            title: "Thunderstorm",
            description: "Thunderstorm with light hail.",
            icon: "⛈"
        },

        99: {
            title: "Severe thunderstorm",
            description: "Thunderstorm with heavy hail.",
            icon: "⛈"
        }

    };


    return weatherCodes[code] || {
        title: "Unknown",
        description: "Weather condition unavailable.",
        icon: "—"
    };

}


/* =================================
   Dynamic Weather Note
================================= */

function createWeatherNote(current) {

    const temp = current.temperature_2m;
    const wind = current.wind_speed_10m;
    const humidity = current.relative_humidity_2m;

    if (temp >= 35) {
        return "Very warm conditions are being reported. Stay hydrated and limit prolonged exposure to direct sunlight.";
    }

    if (humidity >= 85 && temp >= 25) {
        return "Warm and humid conditions are being reported. Light clothing and regular hydration may help.";
    }

    if (temp >= 30 && wind < 10) {
        return "A warm and fairly calm day. Light clothing should be comfortable.";
    }

    if (temp < 15) {
        return "Cool conditions are currently being reported. A light layer may be useful outdoors.";
    }

    if (wind >= 25) {
        return "Windy conditions are being reported. Keep an eye on local conditions if heading outside.";
    }

    if (humidity < 35) {
        return "The air is relatively dry today. Staying hydrated may be helpful.";
    }

    return "Current conditions look moderate. A comfortable time for normal outdoor activity.";
}


/* =================================
   Loading State
================================= */

function showLoading(city) {

    loading.classList.remove("hidden");

    loadingText.textContent =
        `Finding ${city}...`;

}


function hideLoading() {

    loading.classList.add("hidden");

}


/* =================================
   Error Handling
================================= */

function showError(title, message) {

    errorTitle.textContent =
        title;

    errorMessage.textContent =
        message;

    errorBox.classList.remove("hidden");

}


function hideError() {

    errorBox.classList.add("hidden");

}


/* =================================
   Status Indicator
================================= */

function setStatus(status) {

    statusText.textContent = status;

    const dot = document.querySelector(".status-dot");

    if (!dot) return;

    if (status === "LIVE") {

        dot.style.background = "#4c9b70";

    } else if (status === "OFFLINE") {

        dot.style.background = "#e87568";

    } else {

        dot.style.background = "#b08a3c";
    }
}


/* =================================
   Recent Searches
================================= */

function saveRecentCity(city) {

    let cities =
        JSON.parse(
            localStorage.getItem("weatherCities")
        ) || [];


    cities =
        cities.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    cities.unshift(city);


    /*
     * Keep only the latest 5 cities.
     */

    cities =
        cities.slice(0, 5);


    localStorage.setItem(
        "weatherCities",
        JSON.stringify(cities)
    );

}


function renderRecentCities() {

    const cities =
        JSON.parse(
            localStorage.getItem("weatherCities")
        ) || [];


    recentCities.innerHTML = "";


    if (cities.length === 0) {

        recentCities.innerHTML =
            `<span class="empty-history">
                No recent searches
            </span>`;

        return;
    }


    cities.forEach(city => {

        const button =
            document.createElement("button");

        button.className =
            "recent-city";

        button.textContent =
            city;


        button.addEventListener(
            "click",
            () => searchWeather(city)
        );


        recentCities.appendChild(button);

    });

}


/* =================================
   Clear Search History
================================= */

clearHistoryBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "weatherCities"
        );

        renderRecentCities();

    }
);


/* =================================
   Initial Load
================================= */

renderRecentCities();

/* =================================
   Rain Forecast
================================= */

function updateRainForecast(data) {

    const daily = data.daily;

    /* Safety check */
    if (!daily || !daily.time) {

        console.error(
            "Rain forecast data missing:",
            data
        );

        rainAlertText.textContent =
            "FORECAST UNAVAILABLE";

        return;
    }


    /* =========================
       Today's Rain
    ========================= */

    const todayChance =
        daily.precipitation_probability_max?.[0] ?? 0;

    const todayAmount =
        daily.rain_sum?.[0] ?? 0;

    const todayHours =
        daily.precipitation_hours?.[0] ?? 0;


    todayRainChance.textContent =
        Math.round(todayChance);

    todayRainAmount.textContent =
        Number(todayAmount).toFixed(1);

    todayRainHours.textContent =
        Number(todayHours).toFixed(1);


    /* =========================
       Rain Alert
    ========================= */

    updateRainAlert(todayChance);


    /* =========================
       Five Day Forecast
    ========================= */

    rainForecastGrid.innerHTML = "";


    daily.time.forEach((dateValue, index) => {

        const date =
            new Date(dateValue + "T12:00:00");


        const dayName =
            index === 0
                ? "TODAY"
                : date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                ).toUpperCase();


        const probability =
            daily.precipitation_probability_max?.[index] ?? 0;


        const rainAmount =
            daily.rain_sum?.[index] ?? 0;


        const weatherCode =
            daily.weather_code?.[index];


        const weatherInfo =
            getWeatherInfo(weatherCode);


        const card =
            document.createElement("article");

        card.className =
            "rain-day";


        card.innerHTML = `
            
            <span class="rain-day-name">
                ${dayName}
            </span>

            <div class="rain-day-icon">
                ${weatherInfo.icon}
            </div>

            <p class="rain-day-condition">
                ${weatherInfo.title}
            </p>

            <div class="rain-probability">
                ${Math.round(probability)}%
                <span>rain</span>
            </div>

            <p class="rain-amount">
                ${Number(rainAmount).toFixed(1)} mm expected
            </p>

        `;


        rainForecastGrid.appendChild(card);

    });

}


/* =================================
   Rain Alert
================================= */

function updateRainAlert(probability) {

    rainAlert.classList.remove(
        "high",
        "low"
    );


    if (probability >= 60) {

        rainAlert.classList.add("high");

        rainAlertText.textContent =
            "HIGH CHANCE OF RAIN";

        return;
    }


    if (probability >= 30) {

        rainAlert.classList.add("high");

        rainAlertText.textContent =
            "RAIN POSSIBLE";

        return;
    }


    rainAlert.classList.add("low");

    rainAlertText.textContent =
        "LOW RAIN CHANCE";
}

/* =================================
   Theme Switcher
================================= */

function applyTheme(theme) {

    if (theme === "light") {

        document.body.classList.add(
            "light-theme"
        );

        themeIcon.textContent = "☾";

    } else {

        document.body.classList.remove(
            "light-theme"
        );

        themeIcon.textContent = "☀";
    }

}


/* Load saved theme */

const savedTheme =
    localStorage.getItem("weatherTheme") || "dark";

applyTheme(savedTheme);


/* Change theme */

themeBtn.addEventListener(
    "click",
    () => {

        const isLight =
            document.body.classList.contains(
                "light-theme"
            );

        const newTheme =
            isLight ? "dark" : "light";


        applyTheme(newTheme);


        localStorage.setItem(
            "weatherTheme",
            newTheme
        );

    }
);

/* =========================================
   City Autocomplete
========================================= */

let suggestionTimer = null;

let suggestionController = null;

let selectedSuggestion = -1;


/* -----------------------------------------
   Search input typing
----------------------------------------- */

cityInput.addEventListener("input", () => {

    const query =
        cityInput.value.trim();


    /* Clear button */

    if (query.length > 0) {

        clearSearchBtn.classList.add("visible");

    } else {

        clearSearchBtn.classList.remove("visible");

        hideSuggestions();

        return;
    }


    /* Need at least 2 characters */

    if (query.length < 2) {

        hideSuggestions();

        return;
    }


    /* Debounce API request */

    clearTimeout(suggestionTimer);


    suggestionTimer = setTimeout(() => {

        fetchCitySuggestions(query);

    }, 300);

});


/* -----------------------------------------
   Fetch suggestions
----------------------------------------- */

async function fetchCitySuggestions(query) {

    try {

        if (suggestionController) {
            suggestionController.abort();
        }

        suggestionController =
            new AbortController();

        showSuggestionLoading();


        const url =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=100&language=en&countryCode=IN&format=json`;


        const response = await fetch(url, {
            signal: suggestionController.signal
        });


        if (!response.ok) {
            throw new Error("Suggestion request failed");
        }


        const data =
            await response.json();


        let results =
            data.results || [];


        /*
         * Keep populated places.
         *
         * PPL   = populated place
         * PPLA  = administrative city
         * PPLA2 = administrative town
         * PPLA3 = smaller administrative place
         * PPLA4 = village
         * PPLL  = populated locality
         * PPLX  = section of populated place
         */

        const allowedTypes = new Set([
            "PPL",
            "PPLA",
            "PPLA2",
            "PPLA3",
            "PPLA4",
            "PPLL",
            "PPLX"
        ]);


        results =
            results.filter(place =>
                allowedTypes.has(
                    place.feature_code
                )
            );


        const search =
            query.toLowerCase();


        /*
         * Smart ranking
         */

        results.sort((a, b) => {

            const aName =
                (a.name || "").toLowerCase();

            const bName =
                (b.name || "").toLowerCase();


            /* Exact match */

            const aExact =
                aName === search ? 1 : 0;

            const bExact =
                bName === search ? 1 : 0;


            if (aExact !== bExact) {
                return bExact - aExact;
            }


            /* Starts with query */

            const aStarts =
                aName.startsWith(search)
                    ? 1
                    : 0;

            const bStarts =
                bName.startsWith(search)
                    ? 1
                    : 0;


            if (aStarts !== bStarts) {
                return bStarts - aStarts;
            }


            /*
             * Prefer villages / smaller
             * populated places slightly
             */

            const villageTypes = new Set([
                "PPLA4",
                "PPLL",
                "PPL"
            ]);


            const aVillage =
                villageTypes.has(
                    a.feature_code
                ) ? 1 : 0;


            const bVillage =
                villageTypes.has(
                    b.feature_code
                ) ? 1 : 0;


            if (aVillage !== bVillage) {
                return bVillage - aVillage;
            }


            /* Population only as final tie-breaker */

            return (
                Number(b.population || 0) -
                Number(a.population || 0)
            );

        });


        /*
         * Remove duplicates
         */

        const unique = [];

        const seen = new Set();


        for (const place of results) {

            const key =
                `${place.name}|${place.admin1}|${place.admin2}`
                    .toLowerCase();


            if (!seen.has(key)) {

                seen.add(key);

                unique.push(place);

            }

        }


        renderSuggestions(
            unique.slice(0, 10)
        );


    } catch (error) {

        if (
            error.name === "AbortError"
        ) {
            return;
        }


        console.error(
            "Suggestion error:",
            error
        );

        hideSuggestions();

    }

}


/* -----------------------------------------
   Render suggestions
----------------------------------------- */

function renderSuggestions(results) {

    suggestions.innerHTML = "";

    selectedSuggestion = -1;


    if (!results.length) {

        suggestions.innerHTML = `
            <div class="suggestions-empty">
                No matching cities found
            </div>
        `;

        suggestions.classList.remove(
            "hidden"
        );

        return;
    }


    results.forEach((place, index) => {

        const item =
            document.createElement("button");


        item.type = "button";

        item.className =
            "suggestion-item";


        const city =
            place.name || "Unknown";

        const country =
            place.country || "";

        const admin =
            place.admin1 || "";


        const typeMap = {

            PPLC: "Capital",

            PPLA: "City",

            PPLA2: "Town",

            PPLA3: "Town",

            PPLA4: "Village",

            PPLL: "Village",

            PPL: "Settlement",

            PPLX: "Locality"

        };


        const locationType =
            typeMap[place.feature_code] ||
            "Place";


        const location =
            [
                locationType,
                place.admin1,
                place.country
            ]
         .filter(Boolean)
         .join(" · ");


        item.innerHTML = `

            <span class="suggestion-icon">
                ⌖
            </span>

            <span class="suggestion-info">

                <span class="suggestion-city">
                    ${escapeSuggestionText(city)}
                </span>

                <span class="suggestion-location">
                    ${escapeSuggestionText(location)}
                </span>

            </span>

        `;


        item.addEventListener(
            "click",
            () => {

                selectSuggestion(
                    place
                );

            }
        );


        suggestions.appendChild(item);

    });


    suggestions.classList.remove(
        "hidden"
    );
}


/* -----------------------------------------
   Select city
----------------------------------------- */

function selectSuggestion(place) {

    cityInput.value =
        place.name;


    hideSuggestions();


    clearSearchBtn.classList.add(
        "visible"
    );


    /*
     * Directly use coordinates
     * instead of searching the name again.
     */

    searchWeatherByCoordinates(
        place.latitude,
        place.longitude,
        place.name,
        place.country || ""
    );
}


/* -----------------------------------------
   Search weather using suggestion
----------------------------------------- */

async function searchWeatherByCoordinates(
    latitude,
    longitude,
    city,
    country
) {

    try {

        hideError();

        weatherDashboard.classList.add(
            "hidden"
        );

        setStatus("SEARCHING");


        showLoading(city);


        const weatherResponse =
            await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,visibility&daily=weather_code,precipitation_probability_max,rain_sum,precipitation_hours&forecast_days=5&timezone=auto`
            );


        if (!weatherResponse.ok) {

            throw new Error(
                "Weather request failed"
            );
        }


        const data =
            await weatherResponse.json();


        updateWeatherUI(
            {
                name: city,
                country: country
            },
            data
        );


        weatherDashboard.classList.remove(
            "hidden"
        );


        setStatus("LIVE");


        saveRecentCity(city);


        renderRecentCities();


    } catch (error) {

        console.error(error);

        setStatus("OFFLINE");

        showError(
            "Weather unavailable",
            "We couldn't fetch weather data for this location."
        );

    } finally {

        hideLoading();

    }

}


/* -----------------------------------------
   Keyboard navigation
----------------------------------------- */

cityInput.addEventListener(
    "keydown",
    (event) => {

        const items =
            suggestions.querySelectorAll(
                ".suggestion-item"
            );


        if (
            event.key === "ArrowDown"
        ) {

            if (!items.length) {
                return;
            }

            event.preventDefault();


            selectedSuggestion =
                Math.min(
                    selectedSuggestion + 1,
                    items.length - 1
                );


            updateActiveSuggestion(items);

        }


        else if (
            event.key === "ArrowUp"
        ) {

            if (!items.length) {
                return;
            }

            event.preventDefault();


            selectedSuggestion =
                Math.max(
                    selectedSuggestion - 1,
                    0
                );


            updateActiveSuggestion(items);

        }


        else if (
            event.key === "Enter"
        ) {

            if (
                selectedSuggestion >= 0 &&
                items[selectedSuggestion]
            ) {

                event.preventDefault();

                items[
                    selectedSuggestion
                ].click();

            }

        }


        else if (
            event.key === "Escape"
        ) {

            hideSuggestions();

        }

    }
);


/* -----------------------------------------
   Active suggestion
----------------------------------------- */

function updateActiveSuggestion(items) {

    items.forEach(
        (item, index) => {

            item.classList.toggle(
                "active",
                index === selectedSuggestion
            );

        }
    );

}


/* -----------------------------------------
   Clear search
----------------------------------------- */

clearSearchBtn.addEventListener(
    "click",
    () => {

        cityInput.value = "";

        clearSearchBtn.classList.remove(
            "visible"
        );

        hideSuggestions();

        cityInput.focus();

    }
);


/* -----------------------------------------
   Hide suggestions
----------------------------------------- */

function hideSuggestions() {

    suggestions.classList.add(
        "hidden"
    );

    suggestions.innerHTML = "";

    selectedSuggestion = -1;

}


/* -----------------------------------------
   Loading suggestions
----------------------------------------- */

function showSuggestionLoading() {

    suggestions.innerHTML = `
        <div class="suggestions-loading">
            Finding cities...
        </div>
    `;

    suggestions.classList.remove(
        "hidden"
    );

}


/* -----------------------------------------
   Click outside
----------------------------------------- */

document.addEventListener(
    "click",
    (event) => {

        if (
            !event.target.closest(
                ".search-input-area"
            )
        ) {

            hideSuggestions();

        }

    }
);


/* -----------------------------------------
   Safe text
----------------------------------------- */

function escapeSuggestionText(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}