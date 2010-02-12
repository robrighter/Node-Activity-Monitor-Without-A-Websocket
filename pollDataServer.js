var fu = require("./lib/fu");
var sys = require('sys');
process.mixin(GLOBAL, require("./lib/underscore"));
var lpb = require("./lib/longpollingbuffer");
var url = require("url");

HOST = null; // localhost
PORT = 8000;

//helper function
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
}

// Now start the program
fu.listen(PORT, HOST);
var rb = new lpb.LongPollingBuffer(200);
var iostat = process.createChildProcess("iostat", ["-w 1"])


//Setup the listener to handle the flow of data from iostat 
iostat.addListener("output", function (data) {
    sys.puts(data);
    if(data.search(/cpu/i) == -1){ //suppress the column header from iostat
        rb.push(data.trim().split(/\s+/).join(" "));
    }
});

//Setup the updater page for long polling  
fu.get("/update", function (req, res) {
      res.sendHeader(200,{"Content-Type": "text/html"});
      var thesince;
      if(url.parse(req.url,true).hasOwnProperty('query') && url.parse(req.url,true).query.hasOwnProperty('since')){
          thesince = parseInt(url.parse(req.url,true)['query']['since']);
      }
      else {
          thesince = -1;
      }
      rb.addListenerForUpdateSince(thesince, function(data){
           var body = '['+_.map(data,JSON.stringify).join(',\n')+']';
           res.sendBody( body );
           res.finish();
      });
});
  
// Static Files
fu.get("/", fu.staticHandler("./client-side/index.html"));
fu.get("/css/site.css", fu.staticHandler("./client-side/css/site.css"));
fu.get("/js/site.js", fu.staticHandler("./client-side/js/site.js"));
  
  