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

slack.send({
  
    channel: 'azure',
    text:  'test data',		
    username: "Amrita"
}); 

