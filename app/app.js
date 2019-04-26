{
  $(document).ready(function () {
    app.initialized()
      .then(function (_client) {
        var client = _client;
        const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather?";             // api to Fetch current weather data
        const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast?";           // api to Fetch weather forecast

        // open weather map API return values in derived unit, such as kelvin for weather and m/s for speed, Convert Accordingly 
        const TO_CELSIUS = 273.15;                                                          // Constant used in converting kelvin value to degree celsius
        const TO_KMPH = 3.6;
        var city = "";
        var forecastArray = [];
        client.events.on('app.activated',
          function () {

            /**
             * @param
             * api_key: 
             * @description
             * Fetch API key from iparams and invoke necessary functions on load 
             */
            client.iparams.get("api_key")
              .then(function (data) {
                const API_KEY = data.api_key;

                // Function invocations
                getCities();
                getLastFiveCities();
                dateOperations();
                getCurrentWeather(API_KEY);
                bindEventListeners(API_KEY);

              },
                function (e) {
                  fdLogger.log(e);

                  // failure operation
                })
              .catch(function (e) {
                fdLogger.log(e);
              });

            /**
             * @param {*} API_KEY
             * @description
             * combination of functions that are invoked on event.
             */
            function bindEventListeners(API_KEY) {

              $("#find-weather").click(() => {
                getWeatherForecast(API_KEY)
              });

              $('#lastFiveCities').click(showRecentForecast);
            }

            /**
             * 
             * @param {*} event 
             * @description
             * Function to provide access recenlty visted city
             */
            function showRecentForecast(event) {

              $('#selected-city').val(event.target.innerText);
              $('#find-weather').click();
            }


            /**
             * 
             * @param {*} api_key 
             * @description
             * Get current weather of Agent's current City
             */
            function getCurrentWeather(api_key) {

              // Fetching Agent data to find Agent's city using data API
              client.data.get('contact')
                .then(function (data) {
                  city = data.contact.time_zone
                  $('#current-city').text(city);
                  currentWeather(api_key, city);
                })
                .catch(function (e) {
                  fdLogger.log(e);
                });
            }

            /**
             * 
             * @param {*} api_key 
             * @description
             * function that makes an api call to weather api and appends the output to HTML
             */
            function currentWeather(api_key, currrentCity) {

              client.request.get(`${CURRENT_URL}q=${currrentCity}&appid=${api_key}`)
                .then(
                  function (data) {

                    var weatherInCelsius = JSON.parse(data.response).main.temp - TO_CELSIUS;
                    weatherInCelsius = weatherInCelsius.toFixed(2);
                    var windSpeed = JSON.parse(data.response).wind.speed;
                    windSpeed = windSpeed * TO_KMPH;
                    windSpeed = windSpeed.toFixed(2);
                    $('#current-temp').append(`<div> ${weatherInCelsius} &#8451;</div>`);
                    $('#current-windspeed').append(`<div> ${windSpeed} km/hr </div>`);
                  },
                  function (e) {
                    fdLogger.log(e);
                  });
            }

            /**
             * 
             * @param {*} api_key 
             * @description
             * Function to get weather forecast for a selected city and date
             */
            function getWeatherForecast(api_key) {

              // Fetch User Inputs 
              var choosenDate = $('#weather-date').val();
              var choosenCity = $('#selected-city').val();
              client.request.get(`${FORECAST_URL}q=${choosenCity}&appid=${api_key}`)
                .then(function (data) {
                  const resultArray = JSON.parse(data.response).list;
                  var forecast = "";
                  var forecastWeather = "";
                  var forecastWindSpeed = "";
                  for (var data of resultArray) {
                    if (data.dt_txt == choosenDate + " 06:00:00") {
                      forecast = data;
                      forecastWeather = forecast.main.temp;
                      forecastWeather = forecastWeather - TO_CELSIUS;
                      forecastWeather = forecastWeather.toFixed(2);
                      forecastWindSpeed = forecast.wind.speed;
                      forecastWindSpeed = forecastWindSpeed * TO_KMPH;
                      forecastWindSpeed = forecastWindSpeed.toFixed(2);
                      break;
                    }
                  }
                  $('#forecast').empty();
                  $('#forecast').append(`
                  <h3>Weather Forecast at ${choosenCity} on ${choosenDate}</h3>
                  <div id="Weather-forecast-details" class="fw-content-list">
                    <div class="muted"> Temperature</div>
                    <div> ${forecastWeather} &#8451;</div>
                  </div>
                  <div class="fw-content-list">
                    <div class="muted">Forecast wind Speed</div>
                    <div>${forecastWindSpeed} km/hr</div>
                  </div>`);
                  // save current city into recently searched city in array in local storage, if not already available
                  storeLastFiveCities(choosenCity);

                },
                  function (e) {
                    fdLogger.log(e);
                  })
                .catch(function (e) {
                  fdLogger.log(e);
                });
            }

            /**
             * 
             * @param {*} api_key 
             * @description
             * Function to get Get List of Cities for city DropDown
             */
            function getCities() {

              // Fetch Defined cities list from module defined in city-list.js
              const CITIES_LIST = fdWeatherApp.getDefaultCityList();


              // append city list to city select box in Template.html
              CITIES_LIST.forEach(function (data) {
                $('#selected-city').append(`<option value="${data}">${data}</option>`);
              })
            }


            /**
             * 
             * @param {*} forecast 
             * @description
             * Function to check the local storage and save recently accesed non repeating city
             */
            function storeLastFiveCities(forecast) {

              var storedData = localStorage.getItem("forecast");

              if (storedData == null) {
                localStorage.setItem("forecast", JSON.stringify(forecastArray));
              }

              forecastArray = JSON.parse(localStorage.getItem("forecast"));

              if (!forecastArray.includes(forecast)) {
                if (forecastArray.length === 5) {
                  forecastArray.splice(0, 1);
                }
                forecastArray.unshift(forecast);
              }
              localStorage.setItem("forecast", JSON.stringify(forecastArray));
              getLastFiveCities();
            }

            /**
             * @description
             * Function to Fetch recently accesed five cities stored in local storage to display on app load.
             */
            function getLastFiveCities() {

              var lastFiveCities = JSON.parse(localStorage.getItem("forecast")) || [];
              $('#lastFiveCities').empty();
              lastFiveCities.forEach(function (data) {
                $('#lastFiveCities').append(`<li class="list-country"><a href="#Weather-forecast-details">${data}</a></li>`)
              })
            }

            /**
             * @description
             * Function to Perform All date Operations such setting min and max dates 
             */
            function dateOperations() {
              Date.prototype.addDays = function (days) {
                var date = new Date(this.valueOf());
                date.setDate(date.getDate() + days);
                return date;
              }

              var foreCastDate = new Date();
              // Converting dates to ISO format to set as attributes in HTML 
              var startdate = foreCastDate.addDays(1).toISOString().substring(0, 10);
              var endDate = foreCastDate.addDays(5).toISOString().substring(0, 10);

              // Setting up Attributes in HTML
              $("#weather-date").attr("min", startdate);
              $("#weather-date").attr("max", endDate);
              $("#weather-date").attr("value", startdate);
            }
          });
      })
      .catch(function (e) {
        fdLogger.log(e);
      });
  });
}
