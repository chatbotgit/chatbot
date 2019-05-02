var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
var mongoose = require('mongoose');
var leaveModel = require('./employee.model');

var MY_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";
var slack = require('slack-notify')(MY_SLACK_WEBHOOK_URL);

app.use('/public', express.static(__dirname + "/public"));
app.get('/', function (req, res) {
    res.set({
        'Access-Control-Allow-Origin': '*' 
    });
    return res.redirect('public/login.html')
});
/**Start Print system date using javascript*/

function getsystemdate() {
    now = new Date();
    year = "" + now.getFullYear();
    month = "" + (now.getMonth() + 1);

    if (month.length == 1) {
        month = "0" + month;
    }
    day = "" + now.getDate();
    if (day.length == 1) {
        day = "0" + day;
    }
    hour = "" + now.getHours();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    minute = "" + now.getMinutes();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    second = "" + now.getSeconds();
    if (second.length == 1) {
        second = "0" + second;
    }
    return day + "-" + month + "-" + year + " " + hour + ":" + minute + ":" + second;
}
var currentTime = getsystemdate();

/**End Print system date using javascript*/

/** start connection  from servicenow*/
const sn = require('servicenow-rest-api');
const ServiceNow = new sn('dev49606', 'admin', '10Service@321');
/** end connection  from servicenow*/

/**set port using env variable */
var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function () {
    console.log("Listening on --- Port 3000");
});

/** start connection from mongodb */
mongoose.connect("mongodb://admin:admin123@ds235850.mlab.com:35850/leave_management", { useNewUrlParser: true }).then(
    (res) => {
        console.log("Connected to Database Successfully.");
    }
).catch(() => {
    console.log("Conntection to database failed.");
});
/** End connection from mongodb */

/** getting employee leave details from emp_leave collection */
app.get('/getemployees', (req, res) => {
    var method = { cur_date : -1  };
    leaveModel.find().sort(method).find(function(err, result) {
        if (err) {
            console.log("error in data ");
        } else {
            res.json(result);
        }
    });
});
/**function to chnage date format in dd/mm/yyyy format */
function date(datestring){
    var getdate = datestring.split('-');
    var month = parseInt(getdate[1], 10);
    var newdate =  getdate[2] + '/' + month + '/' + getdate[0];
    return newdate;
}

/** insert employee leave details into emp_leave collection */
app.post('/employees', (req, res) => {
    var emp = new leaveModel();
    var start_date = date(req.body.start_date);
    var end_date = date(req.body.end_date); 
    emp.name = req.body.empname;
    emp.start_date = start_date;
    emp.end_date = end_date;
    emp.leave_type = req.body.leave_type; 
    emp.desc = req.body.desc;
    emp.leave_status = req.body.leave_status;
    emp.empid = req.body.emp_id;
    emp.cur_date = currentTime;
    emp.save(); 
    res.json({            
        message: "record Ins`erted"
    })
   slack.send({
        channel: '#notifications',
        text:  'Leave for ' +req.body.empname +' ('+ req.body.emp_id +') is created successfully with start date ' +start_date,		
        username: "Amrita"
    }); 
});
/** update employee leave details into emp_leave collection */
 app.post('/apporveleave', (req, res) => {
    var myquery = { _id: req.body.id };
    var newvalues = { $set: { leave_status: "Approved" } };
    leaveModel.updateOne(myquery, newvalues, function (err, res) { 	
        if (err) throw err;
        console.log("1 document updated");
    });
      slack.send({
        channel: '#notifications',
        text: 'Leave for ' +req.body.empname +' with start date '+req.body.l_start_date+' is updated successfully with status Apporved',
        //username: req.body.empname
    }); 
})

/**Rest Api for to get,post,update service now and leavemanagement system */
app.post('/chatbot', (req, response) => {
    console.log('displayname.... ', req.body.queryResult.intent.displayName);
    switch (req.body.queryResult.intent.displayName) {
        /**Getting ticket details from service now */
        case "getServiceNowTkt":
            response.setHeader('Content-Type', 'application/json');
            const fields = [
                'number',
                'short_description',
                'assignment_group',
                'priority',
                'incident_state'
            ];
            const filters = [
                'number=' + req.body.queryResult.parameters.tktnumber
            ];
            ServiceNow.getTableData(fields, filters, 'incident', res => {
		
                console.log(JSON.stringify({ "fulfillmentText": "Ticketnumber: " + res[0].number + " status is " + res[0].incident_state + " and description : " + res[0].short_description }));
                response.send(JSON.stringify({ "fulfillmentText": "Ticketnumber:  " + res[0].number + " status is " + res[0].incident_state + " and description : " + res[0].short_description }));
            });
            break;
			/**Getting ticket urgency from service now */
        case "geturgencyofticket":
            response.setHeader('Content-Type', 'application/json');
            const fieldsarray = [
                'number',
                'urgency'             
            ];
            const filtersarray = [
                'number=' + req.body.queryResult.parameters.ticketnumber
            ];
            ServiceNow.getTableData(fieldsarray, filtersarray, 'incident', res => {
                console.log("data is here", res);
                var result = res[0].urgency;
                var data = result.split("-", -1);
                var urgencydata = data[1];
                console.log(JSON.stringify({ "fulfillmentText": "Ticketnumber: " + res[0].number + " urgeny is " +urgencydata }));
                response.send(JSON.stringify({ "fulfillmentText": "Ticketnumber: " + res[0].number + " urgeny is " +urgencydata }));
            });
            break;
        /**Create new ticket in service now */
        case "createnewticketservicenow":
            var sort_desc = (req.body.queryResult.parameters.sort_description).toString();
            const data = {
                'short_description': (req.body.queryResult.parameters.sort_description).toString(),
                'urgency': (req.body.queryResult.parameters.urgency).toString(),
                'assignment_group': 'Hardware'
            };
            ServiceNow.createNewTask(data, 'incident', res => {
                console.log(JSON.stringify({ "fulfillmentText": "Your ticket " + res.number + " is created successfully with status: " + res.state + " and description: " + res.short_description }));
                response.send(JSON.stringify({ "fulfillmentText": "Your ticket " + res.number + " is created successfully with status: " + res.state + " and description: " + res.short_description }));
            });

            break;
        /**Update ticket status in service now */
        case "updateservicenowticket":
            var status = req.body.queryResult.parameters.ticket_status;
            /**change status in first charater in uppercase */
            function toTitleCase(str) {
                return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            }
            var newstatus = toTitleCase(status);
            const updatedata = {
                'incident_state': newstatus
            };
            ServiceNow.UpdateTask('incident', req.body.queryResult.parameters.ticket_number, updatedata, res => {
                response.setHeader("Content-Type", "application/json");
				response.send(JSON.stringify({ "fulfillmentText": "Your ticket number: " + req.body.queryResult.parameters.ticket_number + " is updated successfully with status " + newstatus }));
				
				/*  if (res = "undefined") {
                    console.log("Unable to process your request")
                    response.send(JSON.stringify({ "fulfillmentText": "Unable to process your request"}));
                } else {
					console.log(JSON.stringify({ "fulfillmentText": "Your ticket number: " + req.body.queryResult.parameters.ticket_number + " is updated successfully with status " + newstatus }));
					response.send(JSON.stringify({ "fulfillmentText": "Your ticket number: " + req.body.queryResult.parameters.ticket_number + " is updated successfully with status " + newstatus }));
				} */
            });
            break;
      /**create leave in lob */
        case "createleave":
            var emp = new leaveModel();
            console.log("data is here", req.body);
            emp.name = "Amrita";
            emp.leave_type = req.body.queryResult.parameters.leavetype;
            emp.start_date = req.body.queryResult.parameters.startdate;
            emp.end_date = req.body.queryResult.parameters.enddate;
            emp.desc = req.body.queryResult.parameters.leavedes;
			emp.cur_date = currentTime;
			emp.empid = 156539;
            emp.leave_status = "Pending";
            emp.save();
            console.log("Your leave has been successfully.Leave type is " + emp.leave_type + " and starting date: " + emp.start_date);
            response.send(JSON.stringify({ "fulfillmentText": "Your leave has been created successfully. Leave type is " + emp.leave_type + " and starting date: " + emp.start_date}));
            break;
        /**search leave in lob */
        case "searchleave":
            var start_date = req.body.queryResult.parameters.startdate;
			console.log("body data is here", req.body);
            leaveModel.find({ "start_date": start_date }, function (err, data) {
                if (err) { return handleError(res, err); }
                console.log("search data", data);
                console.log(data[0].name);
                response.send(JSON.stringify({ "fulfillmentText": "Employee name: " + data[0].name + " leave start date is: " + data[0].start_date + " and Status is " + data[0].leave_status }));
            });
            break;
			/**search leave list for pending status in lob */
        case "pendingemployeelist":
           leaveModel.find({ "leave_status": "Pending" }, function (err, data) {
                response.setHeader('Content-Type', 'application/json');
                if (err) { return handleError(res, err); }
                var result;
                data.forEach(function (element) {
                    result += "Employee id: " + element.empid + " and start date : " + element.start_date + " Status is " + element.leave_status + '\n';
                });
				 var resultstring = result.substring(9);
                response.send(JSON.stringify({ "fulfillmentText": resultstring }));               
            });
            break;
      /**update leave in lob */
          case "apporveleave":
            var myquery = { empid: req.body.queryResult.parameters.empid, start_date: req.body.queryResult.parameters.startdate };
            var newvalues = { $set: { leave_status: "Approved" } };
            leaveModel.updateOne(myquery, newvalues, function (err, data) {
                if (err) throw err;
                console.log("1 document updated", data);
                response.send(JSON.stringify({ "fulfillmentText": "Employee id:" + req.body.queryResult.parameters.empid +"with start date "+req.body.queryResult.parameters.startdate+ " is apporved successfully." }));
            });
            break;
			case "deleteleave":
            var myquery = { _id: req.body.queryResult.parameters.leaveid };
            leaveModel.remove(myquery, function (err, obj) {
                if (err) throw err;
                console.log(" document(s) deleted");
                response.send(JSON.stringify({ "fulfillmentText": "Deleted record successfully for Id " + req.body.queryResult.parameters.leaveid }));
            });
            break;
    }

})