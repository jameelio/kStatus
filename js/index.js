/*global fetch Handlebars*/
(function() {
'use strict';

var ROOT = 'https://xxxxxx.co.za/kiosks/';

var   BUTTON_STATUS_LOAD = 'LOAD STATUS',
      BUTTON_STATUS_BUSY = 'LOADING...',
      BUTTON_STATUS_RETRY = 'FAILED. RETRY?';

var KIOSK_ID;

(function constructor() {
	 registerClickHandlers();
     setButtonStatus(BUTTON_STATUS_LOAD); 		 
})();

function registerClickHandlers() {
	 document.getElementById('fetchjson').addEventListener('click',fetchTableData);
}

function setButtonStatus(status) {
	 document.getElementById('fetchjson').innerHTML=status;
}
 
function parseJSON(response) {
	 return response.json();
}

function fetchTableData() {
	 setButtonStatus(BUTTON_STATUS_BUSY);
	 var PATH = 'status/';
	 fetch(ROOT + PATH + "?ep=" + Date.now())
		 .then(parseJSON)
		 .then(function(json) {
			 setButtonStatus(BUTTON_STATUS_LOAD);
		     drawTable(processStatusResponse(json));
		 })
		 .catch(function(error) {
			 setButtonStatus(BUTTON_STATUS_RETRY);
			 console.log(error);
		});
}

function processStatusResponse(jsonData) {
	 for(var obj of jsonData) 
	 {
		  obj.last_checkin = new Date(obj.last_checkin).toLocaleString();
		  obj.battery = (obj.battery == null) ? "Not Available" : obj.battery + "%";
		  obj.charging = (obj.charging ==null)	? "Not Available" : (obj.charging="OK");
	 }
	      return jsonData;
}

function drawTable(json) {
     var context = {
		  data: json
     };  
	 var html = Handlebars.templates['kioskStatus'](context);
	 document.getElementById('kioskTableId').innerHTML = html;
	 rowClick();
}

function tableRow(tableId,callback) {
	 var table = document.getElementById(tableId),
	     rows = table.getElementsByTagName('tr'),
	     i;
	 for(i = 0; i < rows.length; i++){
		  table.rows[i].onclick = function (row) {
		  return function () {
		      callback(row);
		   }
		}
		(table.rows[i]);
	}
}

function rowClick() {
	 tableRow('kioskTableId',function (row) {
          KIOSK_ID = row.getElementsByTagName('td')[0].innerHTML;
          fetchModalData();
    });
}

function fetchModalData() {
	 var PATH = 'list?id=';
	 fetch(ROOT + PATH + KIOSK_ID)
	      .then(parseJSON)
	      .then(function(json) {
	     	 populateModal(json);
	      })
	      .catch(function (error) {
	     	console.log(error);
	      });
}

function populateModal(json) {
	 var context = json.data;
	 var html = Handlebars.templates['popUp'](context);
	 document.getElementById('kioskInfo').innerHTML = html;
	 $('#kioskInfo').modal('show');
	 parseInfo(json);
}

function parseInfo(modalData) {
	 var obj = modalData.data;
	 if (obj.mute==1) {
	 	 $('#mute input[type=checkbox]').prop("checked", true);
	 } else {
	 	 $('#mute input[type=checkbox]').prop("checked", false);
	 }
	 newData(modalData);
}

function newData(modalData) {
	 var obj = modalData;
	 delete obj.ok;
	 delete obj.data.ep;
	 delete obj.data.data;
	 delete obj.data.bat;
	 $('#btnSave').on('click',function() {
	 	 obj.data.name = $('#name').val().trim();
         obj.data.group = $('#group').val().trim();
         obj.data.email = $('#email').val().trim();
         obj.data.offtime = parseInt($('#offtime').val().trim());
             if ($('#mute input[type=checkbox]').prop('checked') ==true) {
         	         obj.data.mute = 1;
             }   else {
                     obj.data.mute =0;
         }
         postData(modalData);
         $('#kioskInfo').modal('hide');
	 });
}

function postData(data) {
	 var PATH = 'update?id=';
	 fetch(ROOT + PATH + KIOSK_ID,{
		 mode:'cors',
		 headers:{
			 'Content-Type': 'application/json'
		 },
		 method : 'POST',
		 body: JSON.stringify(data)
	 })
	  .then(function(res){ 
		 return res.json(); 
		 console.log(res);
	 })
	  .then(function (json) {
		 fetchTableData();
	 })
	  .catch(function(err) {
		 console.log(err);
	 });
}
})();
