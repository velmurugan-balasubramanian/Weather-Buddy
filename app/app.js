{
  $(document).ready(function () {
    app.initialized()
      .then(function (_client) {
        var client = _client;
        client.events.on('app.activated',
          function () {
            client.data.get('contact')
              .then(function (data) {
                $('#apptext').text("Ticket created by " + data.contact.name);
                //  var api = "<%= iparam.api %> Hello there" ;
                //console.log("API",api);

              })
              .catch(function (e) {
                console.log('Exception - ', e);
              });

            // var options = {body: JSON.stringify({
            //     q:"London",
            //     //appid: "<%= iparam.api_key %>"
            //     appid:"17f91e9f0a025a4e616b50c063eb7876"
            // })};
            //var options = {};
            var url = "https://api.openweathermap.org/data/2.5/forecast?q=London&appid=";
            // client.request.post(url, options)
            //   .then(
            //     function (data) {
            //       console.log("posstttt", data);
            //     },
            //     function (error) {
            //       console.log(error);
            //     });

            client.iparams.get("api_key").then(
              function (data) {
                console.log("APIKEY", data);
                getWeatherData(data.api_key)
              },
              function (error) {
                console.log(error);
                // failure operation
              }
            );


            function getWeatherData(api_key) {
              console.log("apikeu",api_key);
              console.log("full URL","https://api.openweathermap.org/data/2.5/forecast?q=London&appid="+api_key);
              client.request.post(url+api_key)
                .then(
                  function (data) {
                    console.log("posstttt12334455", data.response);
                  },
                  function (error) {
                    console.log(error);
                  });

            }


          });
      });
  });
}