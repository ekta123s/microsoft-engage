var socket = io();
var params = jQuery.deparam(window.location.search); //Gets the id from url
var timer;
var time = 20;
var pause = false;
//When host connects to server
socket.on('connect', function() {
    
    //Tell server that it is host connection from game view
    socket.emit('teacher-join-quiz', params);
});

socket.on('noQuizFound', function(){
   window.location.href = '../../';//Redirect user to 'join game' page
});

socket.on('quizQuestions', function(data){
    document.getElementById('question').innerHTML = "Question :  " + data.q1;
    document.getElementById('answer1').innerHTML = "Option A :  " + data.a1;
    document.getElementById('answer2').innerHTML = "Option B :  " + data.a2;
    document.getElementById('answer3').innerHTML = "Option C :  " + data.a3;
    document.getElementById('answer4').innerHTML = "Option D :  " + data.a4;
    document.getElementById('playersAnswered').innerHTML = "Students Answered 0 / " + data.studentsInQuiz;
    updateTimer();
});

socket.on('updateStudentsAnswered', function(data){
   document.getElementById('playersAnswered').innerHTML = "Students Answered " + data.studentsAnswered + " / " + data.studentsInQuiz; 
});

socket.on('questionOver', function(studentData, correct){
    clearInterval(timer);
    //Hide elements on page 
    document.getElementById('playersAnswered').style.display = "none";
    document.getElementById('timerText').style.display = "none";
    
    //Shows user correct answer with effects on elements
    if(correct == 1){
        document.getElementById('answer2').style.filter = "grayscale(10%)";
        document.getElementById('answer3').style.filter = "grayscale(10%)";
        document.getElementById('answer4').style.filter = "grayscale(10%)";
        var current = document.getElementById('answer1').innerHTML;
        document.getElementById('answer1').innerHTML = "&#10004" + " " + current;
    }else if(correct == 2){
        document.getElementById('answer1').style.filter = "grayscale(10%)";
        document.getElementById('answer3').style.filter = "grayscale(10%)";
        document.getElementById('answer4').style.filter = "grayscale(10%)";
        var current = document.getElementById('answer2').innerHTML;
        document.getElementById('answer2').innerHTML = "&#10004" + " " + current;
    }else if(correct == 3){
        document.getElementById('answer1').style.filter = "grayscale(10%)";
        document.getElementById('answer2').style.filter = "grayscale(10%)";
        document.getElementById('answer4').style.filter = "grayscale(10%)";
        var current = document.getElementById('answer3').innerHTML;
        document.getElementById('answer3').innerHTML = "&#10004" + " " + current;
    }else if(correct == 4){
        document.getElementById('answer1').style.filter = "grayscale(10%)";
        document.getElementById('answer2').style.filter = "grayscale(10%)";
        document.getElementById('answer3').style.filter = "grayscale(10%)";
        var current = document.getElementById('answer4').innerHTML;
        document.getElementById('answer4').innerHTML = "&#10004" + " " + current;
    }
    
    document.getElementById('nextQButton').style.display = "block";

    nextQuestion();
    
});

function nextQuestion(){
    document.getElementById('nextQButton').style.display = "block";
   
    document.getElementById('answer1').style.filter = "none";
    document.getElementById('answer2').style.filter = "none";
    document.getElementById('answer3').style.filter = "none";
    document.getElementById('answer4').style.filter = "none";
    
    document.getElementById('playersAnswered').style.display = "block";
    document.getElementById('timerText').style.display = "block";
    document.getElementById('num').innerHTML = " 20";
    socket.emit('nextQuestion'); //Tell server to start new question
}

function updateTimer(){
    time = 20;
    timer = setInterval(function(){

        /// When the game is paused timer is not updated
        if(!pause) {
            time -= 1;
        }
        document.getElementById('num').textContent = " " + time;
        if(time == 1){
            socket.emit('timeUp');
        }
    }, 1000);
}

function pauseTimer() {
    var pauseBtn = document.getElementById('pauseTimer');
    if(pause) {
        pauseBtn.innerHTML = "Pause Timer";
        pause = false;
    }

    else {
        pauseBtn.innerHTML = "Play Timer";
        pause = true;
    }
    
}
socket.on('quizOver', function(finalScores){
    document.getElementById('nextQButton').style.display = "none";
    
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('question').style.display ="none";
    document.getElementById('pauseTimer').style.display = "none";
    document.getElementById('timerText').innerHTML = "";
    document.getElementById('playersAnswered').innerHTML = "";

    document.getElementById('scoreTable').style.display = 'block';
    document.getElementById('quiz-over').style.display = 'block';
    document.getElementById('score-title').style.display = 'block';

    var tableBody = document.getElementById('scoreTableBody');
    for(var i = 0; i < finalScores.length; i++) {
        var tr = document.createElement('tr');
        var th = document.createElement('th');
        th.innerHTML = i+1;

        var nametd = document.createElement('td');
        var scoretd = document.createElement('td');
        nametd.innerHTML = finalScores[i].name;
        scoretd.innerHTML = finalScores[i].score;
        tr.appendChild(th);
        tr.appendChild(nametd);
        tr.appendChild(scoretd);
        tableBody.appendChild(tr);
    }
});

socket.on('getTime', function(studentId){
    socket.emit('time', {
        studentId: studentId,
        time: time
    });
});




















