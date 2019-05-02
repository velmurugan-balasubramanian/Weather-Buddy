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
        var forecastArray = ["chennai"];
        client.events.on('app.activated',
          function () {

            /**
             * @param
             * api_key: 
             * @description
             * Fetch api_key from iparams and invoke necessary functions on load 
             */
            client.iparams.get("api_key")
              .then(function () {

                // Function invocations
                getLastFiveCities();
                dateOperations();
                getCurrentWeather();
                bindEventListeners();
                setDefaultCityList();

              })
              .catch(function () {
                displayError("Unable to display weather, Please try again later");
              });

            /**
             * combination of functions that are invoked on event.
             */
            function bindEventListeners() {

              $("#find-weather").click(() => {
                getWeatherForecast()
              });

              $('#lastFiveCities').click(showRecentForecast);
            }

            /**
             * 
             * @param {*} event 
             * event that are triggered while accessing the displayed city
             * @description
             * Function to provide access recenlty visted city
             */
            function showRecentForecast(event) {

              $('#selected-city').val(event.target.innerText);
              $('#find-weather').click();
            }


            /**
             * 
             * Get current weather of Agent's Time Zone
             */
            function getCurrentWeather() {

              // Fetching Agent data to find Agent's Time Zone using data API
              client.data.get('contact')
                .then(function (data) {
                  city = data.contact.time_zone
                  $('#current-city').text(city);
                  fetchWeatherHelper(city);
                })
                .catch(function () {
                  displayError("Unable to Feth your Time Zone")
                });
            }

            /**
             * 
             * @param {*} currrentCity
             * currrentCity is the time zone of the agent fetched from freshDesk Data API
             * @description
             * function that makes an api call to weather api and appends the output to HTML
             */
            function fetchWeatherHelper(currrentCity) {

              client.request.get(`${CURRENT_URL}q=${currrentCity}&appid=<%=iparam.api_key%>`)
                .then(
                  function (data) {

                    var weatherInCelsius = JSON.parse(data.response).main.temp - TO_CELSIUS;
                    weatherInCelsius = weatherInCelsius.toFixed(2);
                    var windSpeed = JSON.parse(data.response).wind.speed;
                    windSpeed = windSpeed * TO_KMPH;
                    windSpeed = windSpeed.toFixed(2);
                    $('#current-temp').append(`<div> ${weatherInCelsius} &#8451;</div>`);
                    $('#current-windspeed').append(`<div> ${windSpeed} km/hr </div>`);
                  })
                .catch(function () {
                  //fdLogger.log(e);
                  displayError("Unable to Display weather right now, Please refresh the page or try again later")
                });
            }

            /**
             * Function to get weather forecast for a selected city and date
             */
            function getWeatherForecast() {

              // Fetch User Inputs 
              var choosenDate = $('#weather-date').val();
              var choosenCity = $('#selected-city').val();
              client.request.get(`${FORECAST_URL}q=${choosenCity}&appid=<%=iparam.api_key%>`)
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
                    displayError(JSON.parse(e.response).message);
                  })
                .catch(function () {
                  displayError("Unbale to Show forecast, Please try again after sometime");
                });
            }


            /**
             * 
             * @param {*} forecast 
             * @description
             * Function to check the local storage and save recently accesed non repeating city
             */
            function storeLastFiveCities(forecastCity) {


              client.db.get("weather").then((data) => {
                forecastArray = data.forecast;

                if (!forecastArray.includes(forecastCity)) {
                  if (forecastArray.length === 5) {
                    forecastArray.splice(4, 5);
                  }
                  forecastArray.unshift(forecastCity);
                }

                setData(forecastArray);

              }).catch(function () {
                displayError("Unable to fetch Recent weather data from storage");
              });

              /**
               * @param {*} forecastArray 
               * forecastArray is the list of recently accessed cities
               * @description
               * the function acts as a helper function to set data in freshdesk storage
               */
              function setData(forecastArray) {
                client.db.set("weather", { "forecast": forecastArray }).then(() => {
                  getLastFiveCities();
                }, () => {
                  displayError("Unable to save the recently accessed city")
                });

              }

            }

            /**
             * @description
             * Function to Fetch recently accesed five cities stored in local storage to display on app load.
             */
            function getLastFiveCities() {

              client.db.get("weather").then((data) => {
                var lastFiveCities = data.forecast;
                $('#lastFiveCities').empty();
                displayLastFiveCities(lastFiveCities);

              }).catch(function () {
                displayError("Unable to fetch Recent weather data from storage");
              });

              function displayLastFiveCities(lastFiveCities) {
                lastFiveCities.forEach(function (data) {
                  $('#lastFiveCities').append(`<li class="list-country"><a href="#Weather-forecast-details">${data}</a></li>`)
                });
              }

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


            /**
             * @description
             * function to provide a default list of 5 cities, when the app is accessed for the first time,
             * which will be updated when the user searches for new cities
             */
            function setDefaultCityList() {
              client.db.set("weather", { "forecast": ["Chennai", "Mumbai", "Dubai", "London", "Paris"] }, { setIf: "not_exist" }).then(() => {
                displayError("list of default cities set")
              }, function () {
                console.log("Recent City list updated");

              });
            }
          });
      })
      .catch(function (e) {
        //fdLogger.log(e);
        displayError(e.toString);

      });
    function displayError(error) {

      $('#error').append(`<div class="alert alert-danger alert-dismissible">
        <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
          ${error}
      </div>`);

      $("#error").css("top", $("body").scrollTop() + "px")

    }
  });
}
