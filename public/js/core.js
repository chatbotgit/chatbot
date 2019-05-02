$(document).ready(function () {

	//  Login employee on click Sign In Button checks that username =='admin' and password == 'admin'
	$("#login").click(function () {
		if ($("#loginusername").val() == 'admin' && $("#loginpassword").val() == 'admin') {
			window.location.href = 'tables.html';
		} else {
			alert("Please enter valid username and password");
		}
		$("#logout").click(function () {
			$("form")[0].reset();
		});
	});

	//  Login Manager on click Sign In Button checks that username =='admin' and password == 'admin'
	$("#managerlogin").click(function () {
		if ($("#loginusername").val() == 'admin' && $("#loginpassword").val() == 'password') {
			window.location.href = 'mlist.html';
		} else {
			alert("Please enter valid username and password");
		}
		$("#logout").click(function () {
			$("form")[0].reset();
		});
	});

	//to get employee list from data base

	//to get employee list from data base for manager access

	$.ajax({
		url: "https://infinite-hamlet-85455.herokuapp.com/getemployees"
	}).then(function (data) {
		$('#loadingmessage').show();
		$.each(data, function (i, l) { 
			if (l.leave_status == "Pending") {
				$("#managerlist tbody").append("<tr><td hidden>" + l._id + "</td><td>" + l.name +"(" +l.empid+ ")</td><td>" + l.leave_type + "</td><td hidden>"+l.cur_date+"</td><td >" + l.start_date + "</td><td>"
					+ l.end_date + "</td><td>" + l.leave_status + "</td><td>" + l.desc + "</td><td style='text-align:center'><button  class='btnSelect btn btn-primary' type='button'> Apporve</button></td></tr>");
			}
			$('#loadingmessage').hide();
		});
	});



});