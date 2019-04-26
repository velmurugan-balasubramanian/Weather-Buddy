((module) => {
    const logs = [];
    module.log =  function(msg) {
        logs.push(msg);
    }

    module.getLogs =  function() {
        return JSON.stringify(logs);
    }
})(window.fdLogger = window.fdLogger || {});
