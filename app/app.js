{
  $(document).ready(function () {
    app.initialized()
      .then(function (_client) {
        var client = _client;
        const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather?";             // api to Fetch current weather data
        const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast?";           // api to Fetch weather forecast

        // open weather map API returns windspeed m/s, Convert Accordingly 
        const TO_KMPH = 3.6;
        var city = "";
        var forecastArray = [];
        client.events.on('app.activated',
          function () {

            // Function invocations
            getLastFiveCities();
            dateOperations();
            getCurrentWeather();
            bindEventListeners();
            setDefaultCityList();

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
                  fetchCurrentWeatherHelper(city);
                })
                .catch(function () {
                  displayNotification("Unable to Feth your Time Zone")
                });
            }


            /**
             * 
             * @param {*} currrentCity
             * currrentCity is the time zone of the agent fetched from freshDesk Data API
             * @description
             * function that makes an api call to weather api and appends the output to HTML
             */
            function fetchCurrentWeatherHelper(currrentCity) {

              client.request.get(`${CURRENT_URL}q=${currrentCity}&appid=<%=iparam.api_key%>&units=metric`)
                .then(
                  function (data) {

                    var weatherInCelsius = JSON.parse(data.response).main.temp;
                    var windSpeed = JSON.parse(data.response).wind.speed;
                    windSpeed = windSpeed * TO_KMPH;
                    windSpeed = windSpeed.toFixed(2);
                    $('#current-temp').append(`<div> ${weatherInCelsius} &#8451;</div>`);
                    $('#current-windspeed').append(`<div> ${windSpeed} km/hr </div>`);

                  })
                .catch(function () {

                  displayNotification("Unable to Display weather right now, Please refresh the page or try again later");

                });
            }


            /**
             * Function to get weather forecast for a selected city and date
             */
            function getWeatherForecast() {

              // Fetch User Inputs 
              var choosenDate = $('#weather-date').val();
              var choosenCity = $('#selected-city').val();

              client.request.get(`${FORECAST_URL}q=${choosenCity}&appid=<%=iparam.api_key%>&units=metric`)
                .then(function (data) {
                  const resultArray = JSON.parse(data.response).list;
                  var month = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December" ];
                  var forecast = resultArray;
                  var forecastWeather = "";
                  var forecastWindSpeed = "";
                  var currentDate = new Date();
                  var choosenDateOSI = new Date(choosenDate);
                  
                  // finding difference between current date and choosen date to locate index of corresponding forecast
                  var dateDiff = choosenDateOSI.getDate() - currentDate.getDate();

                  // finding current the time of first element in the array, to calculate the number  of entries to be removed
                  var dateFlag = 24 - new Date(forecast[0].dt_txt).getHours();
                  dateFlag = dateFlag / 3 + 2;

                  //removing weather of present day from the array 
                  var updatedResultArray = resultArray.slice(dateFlag)
                  forecast = updatedResultArray;

                  if (dateDiff == 1) {
                    forecastWeather = forecast[0].main.temp;
                    forecastWindSpeed = forecast[0].wind.speed;
                    forecastWindSpeed = forecastWindSpeed * TO_KMPH;
                    forecastWindSpeed = forecastWindSpeed.toFixed(2);
                  }
                  else {
                    dateDiff = (dateDiff - 1) * 8;
                    forecastWeather = forecast[dateDiff].main.temp;
                    forecastWindSpeed = forecast[dateDiff].wind.speed;
                    forecastWindSpeed = forecastWindSpeed * TO_KMPH;
                    forecastWindSpeed = forecastWindSpeed.toFixed(2);
                  }

                  $('#forecast').empty();
                  $('#forecast').append(`
                  <h3>Weather Forecast at ${choosenCity} on ${choosenDateOSI.getDate()}th  ${month[choosenDateOSI.getMonth()]}  ${choosenDateOSI.getFullYear()}</h3>
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
                    displayNotification(JSON.parse(e.response).message);
                  })
                .catch(function () {
                  displayNotification("Unbale to Show forecast, Please try again after sometime");
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
                displayNotification("Unable to fetch Recent weather data from storage");
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
                  displayNotification("Unable to save the recently accessed city")
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
                displayNotification("Unable to fetch Recent weather data from storage");
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
                displayNotification("list of default cities set")
              }, function () {

                fdLogger.log("Recent City list updated to display on load");

              });
            }
          });
      })
      .catch(function () {

        fdLogger.log("Error initializing App, Sorry for the inconvenience");

      });


    /**
     * 
     * @param {*} error 
     * error is passed during function invocation
     * @description
     * function to display notification to end user 
     */
    function displayNotification(error) {

      $('#error').append(`<div class="alert alert-danger alert-dismissible">
        <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
          ${error}
      </div>`);

      // To Display the notification on view port 
      $("#error").css("top", $("body").scrollTop() + "px")

    }
  });
}
