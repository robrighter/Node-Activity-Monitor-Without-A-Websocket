var fu = require("./fu");
var sys = require('sys');
process.mixin(GLOBAL, require("./underscore"));

HOST = null; // localhost
PORT = 8000;

//helper functions and classes
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
}


function feeditem (offset,value) {
    this.offset = offset;
    this.value = value;
}


//the readbuffer provides a databuffer with a moving offset that can be used to allow AJAX long polling (instead of the websocket)
function readBuffer (size) {
    this.data = new Array();
    this.size = size;
    this.offset = 0;
    this.push = function(value) {
        this.data.unshift(new feeditem(this.offset++,value));
        while(this.data.length > size){
            this.data.pop([]);
        }
    }
    this.since = function(timestamp) {
        return _.select(this.data, function(item){ return item.offset>timestamp; });
    }
}



// Now start the program
fu.listen(PORT, HOST);
var rb = new readBuffer(200);
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
      var thesince = parseInt(req.uri.params.since);
      if(!thesince){
          thesince = -1;
      }
      var body = '['+_.map(rb.since(thesince),JSON.stringify).join(',\n')+']';
      res.sendBody( body );
      res.finish();
});
  
// Static Files
fu.get("/", fu.staticHandler("./client-side/index.html"));
fu.get("/css/site.css", fu.staticHandler("./client-side/css/site.css"));
fu.get("/js/site.js", fu.staticHandler("./client-side/js/site.js"));
  
  