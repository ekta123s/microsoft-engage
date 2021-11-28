var socket = io();
var studentAnswered = false;
var correct = false;
var name;
var score = 0;
var params = jQuery.deparam(window.location.search); //Gets the id from url
socket.on("connect", function () {
  //Tell server that it is host connection from game view
  socket.emit("student-join-quiz", params);
});
socket.on("noQuizFound", function () {
  window.location.href = "../../"; //Redirect user to 'join game' page
});

function answerSubmitted(num) {
  if (studentAnswered == false) {
    studentAnswered = true;

    socket.emit("studentAnswer", num); //Sends player answer to server

    document.getElementById("message").style.display = "block";
    document.getElementById("message").innerHTML =
      "Answer Submitted! Waiting on other students...";
  }
}
//Get results on last question
socket.on("answerResult", function (data) {
  if (data == true) {
    correct = true;
  }
});
socket.on("questionOver", function (data) {
  if (correct == true) {
    document.getElementById("message").style.display = "block";
    document.getElementById("message").innerHTML = "Correct!";
  } else {
    document.getElementById("message").style.display = "block";
    document.getElementById("message").innerHTML = "Incorrect!";
  }

  socket.emit("getScore");
});

socket.on("newScore", function (data) {
  document.getElementById("scoreText").innerHTML = data;
});

socket.on("nextQuestionStudent", function () {
  correct = false;
  studentAnswered = false;

  document.getElementById("message").style.display = "none";
  document.body.style.backgroundColor = "white";
});

socket.on("teacherDisconnect", function () {
  window.location.href = "../../";
});

socket.on("studentQuizData", function (data) {
  var answer1 = document.getElementById("answer1");
  var answer2 = document.getElementById("answer2");
  var answer3 = document.getElementById("answer3");
  var answer4 = document.getElementById("answer4");
  var question = document.getElementById("question");

  answer1.innerHTML = "Option A : " + data.questionData.answers[0];
  answer2.innerHTML = "Option B : " + data.questionData.answers[1];
  answer3.innerHTML = "Option C : " + data.questionData.answers[2];
  answer4.innerHTML = "Option D : " + data.questionData.answers[3];
  question.innerHTML = data.questionData.question;

  for (var i = 0; i < data.studentData.length; i++) {
    if (data.studentData[i].studentId == socket.id) {
      document.getElementById("nameText").innerHTML = data.studentData[i].name;
      document.getElementById("scoreText").innerHTML =
        data.studentData[i].quizData.score;
    }
  }
});

socket.on("quizOver", function () {
  document.body.style.backgroundColor = "#FFFFFF";
  document.getElementById("message").style.display = "block";
  document.getElementById("message").innerHTML = "QUIZ OVER";
});
