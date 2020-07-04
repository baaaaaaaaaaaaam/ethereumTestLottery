const assert = require('chai').assert;




const inLogs = async (logs,eventName)=>{
    const event=logs.find(e=>e.event === eventName);
    // console.log(event);
    assert.exists(event);
}
module.exports = { 
    inLogs
}