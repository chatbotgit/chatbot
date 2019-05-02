var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

/**service now connection */
const sn = require('servicenow-rest-api');
const ServiceNow = new sn('dev54139', 'admin', 'zXObqPcd3TB9');

/**set port using env variable */
var port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", function () {
    console.log("Listening on --- Port 3000");
});

/**Rest Api for to get,post,updfate service now data */
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
                'number=' +req.body.queryResult.parameters.tktnumber
            ];
            ServiceNow.getTableData(fields, filters, 'incident', res => {
                console.log(JSON.stringify({ "fulfillmentText": "Ticketnumber :" + res[0].number + "details are => Description : " + res[0].short_description + " Status : " + res[0].incident_state }));
                response.send(JSON.stringify({ "fulfillmentText": "Ticketnumber :" + res[0].number + "details are => Description : " + res[0].short_description + " Status : " + res[0].incident_state }));

            });
            break;
        /**Create new ticket in service now */
        case "createnewticketservicenow":
            console.log("craeate tkt data.. ", req.body);
            var sort_desc = (req.body.queryResult.parameters.sort_description).toString();

            const data = {
                'short_description': (req.body.queryResult.parameters.sort_description).toString(),
                'urgency': (req.body.queryResult.parameters.urgency).toString(),
                'priority': (req.body.queryResult.parameters.status).toString(),
                'assignment_group': 'Hardware'
            };
            ServiceNow.createNewTask(data, 'incident', res => {
                console.log(JSON.stringify({ "fulfillmentText": "Your ticket is created successfully with ticket number:" + res.number }));
                response.send(JSON.stringify({ "fulfillmentText": "Your ticket is created successfully with ticket number:" + res.number }));
            });

            break;
        /**Update ticket status in service now */
        case "updateservicenowticket":
       // console.log("hi, i a here", req.body.queryResult.parameters.incident_state);
       const dataarray={
        'incident_state': 'New'
       
    };
    
    ServiceNow.UpdateTask('incident','INC0010012',dataarray,res=>{
        console.log(res);
    });
            break;
    }



})