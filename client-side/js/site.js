
var lastrecieved = -1;
var idoflast = 1;

function getupdate(since){
	var url = "/update";
	if(since != ""){
        url = url + "?since="+ escape(since);
	}
	
	$.getJSON(url,
			  function(data){
				  $.each(data.reverse(), function(i, item) { replacedata(item);});
			  });
	setTimeout('getupdate(lastrecieved)', 500);
}


function replacedata(item){
	html = jQuery.map(item["value"].split(" "), function(v){ return "<td>"+v+"</td>";}).join("");
	$("#updatedcontent").replaceWith("<tr id='updatedcontent'>"+html+"</tr>");
	lastrecieved = item["offset"];
}
