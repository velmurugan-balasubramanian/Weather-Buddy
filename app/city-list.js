((module) => {
    
    // List of All possible cities
    const CITY_NAMES = ["Amsterdam","Bangkok","Beijing","Barcelona","Bengaluru","Chennai","Delhi","Mumbai","Melbourne","Munich","Paris","Sydney"];


    
    module.getDefaultCityList =  function() {
        return CITY_NAMES;
    }
})(window.fdWeatherApp = window.fdWeatherApp || {});