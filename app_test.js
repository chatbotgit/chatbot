var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());



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


 slack.send({
        channel: '#notifications',
        text:  'test data for slack webhook',	
        username: "Amrita"
    }); 
