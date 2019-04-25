{
  $(document).ready(function () {
    app.initialized()
      .then(function (_client) {
        var client = _client;
        const current_url = "https://api.openweathermap.org/data/2.5/weather?"
        const forecast_url = "https://api.openweathermap.org/data/2.5/forecast?";
        const toCelsius = 273.15;
        var forecastArray = [];
        
        client.events.on('app.activated',
          function () {

            client.iparams.get("api_key")
              .then(function (data) {
                const api_key = data.api_key;

                getCities();
                getLastFiveCities();

                getCurrentWeather(api_key)
                $("#find-weather").click(() => {
                  getWeatherForecast(api_key)
                });


              },
                function (error) {
                  console.log(error);
                  // failure operation
                })
              .catch(function (e) {
                console.log('Exception - ', e);
              });


            function getCurrentWeather(api_key) {
              client.data.get('contact')
                .then(function (data) {
                  city = data.contact.time_zone
                  $('#current-city').text(city);
                  client.request.post(`${current_url}q=${city}&appid=${api_key}`)
                    .then(
                      function (data) {
                        console.log(JSON.parse(data.response));
                        const weatherInCelsius = JSON.parse(data.response).main.temp - toCelsius;
                        console.log(JSON.parse(data.response));

                        const windSpeed = JSON.parse(data.response).wind.speed
                        $('#current-temp').text(weatherInCelsius);
                        $('#current-windspeed').text(windSpeed);
                      },
                      function (error) {
                        console.log(error);
                      });


                })
                .catch(function (e) {
                  console.log('Exception - ', e);
                });
            }
            function getWeatherForecast(api_key) {

              const choosenDate = $('#weather-date').val();
              const choosenCity = $('#selected-city').val();

              client.request.post(`${forecast_url}q=${choosenCity}&appid=${api_key}`)
                .then(function (data) {
                  const resultArray = JSON.parse(data.response).list;
                  var forecast = "";
                  var forecastWeather = "";
                  var forecastWindSpeed = ""
                  resultArray.forEach(function (data) {
                    if (data.dt_txt == choosenDate + " 06:00:00") {
                      forecast = data;
                      forecastWeather = forecast.main.temp;
                      forecastWeather = forecastWeather - toCelsius;
                      forecastWeather = forecastWeather.toFixed(0);
                      forecastWindSpeed = forecast.wind.speed;
                    }
                  })

                  $('#forecast').empty();
                  $('#forecast').append(`
                  <h3>Weather Forecast at ${choosenCity} </h3>
                  <div class="fw-content-list">
                    <div class="muted"> Temperature</div>
                    <div> ${forecastWeather}</div>
                  </div>
                  <div class="fw-content-list">
                    <div class="muted">Forecast wind Speed</div>
                    <div>${forecastWindSpeed}</div>
                  </div>`);

                  storeLastFiveCities(choosenCity);

                  },
                  function (error) {
                    console.log(error);
                  })
                .catch(function (e) {
                  console.log('Exception - ', e);
                });
            }

            function getCities(){
            const cityList = fdWeatherApp.getDefaultCityList();
            cityList.forEach(function (data) {
             console.log(data);
             $('#selected-city').append(`<option value="${data}">${data}</option>`) ;
            })
            console.log("All cities",fdWeatherApp.getDefaultCityList());
            }

            function storeLastFiveCities(forecast){
              //var forecastArray = [];
              console.log("forecastArray",forecastArray);
              var storedData = localStorage.getItem("forecast");
              //console.log("storedData",storedData);
              if(storedData == null){
                localStorage.setItem("forecast",JSON.stringify(forecastArray) );
                console.log("heteeee");
              }
              forecastArray = JSON.parse(localStorage.getItem("forecast"));
              
              console.log("forecastArray",forecastArray);
              
             forecastArray.push(forecast)
              console.log("forecastArray",forecastArray);
              //localStorage.setItem("forecast", forecastArray);
              localStorage.forecast = forecastArray;
              getLastFiveCities();
            }

            function getLastFiveCities(){
             
             console.log("local storage City",localStorage.getItem("forecast"));
             localStorage.removeItem("forecast");
            }
          });
      });
  });
}