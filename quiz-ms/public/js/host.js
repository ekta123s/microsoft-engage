var socket = io();
var params = jQuery.deparam(window.location.search);

//When host connects to server
socket.on('connect', function() {

    document.getElementById('studentsJoined').innerHTML = "";
    
    //Tell server that it is host connection
    socket.emit('teacher-join', params);
});

socket.on('showQuizPin', function(data){
   document.getElementById('gamePinText').innerHTML = data.pin;
});

//Adds player's name to screen and updates player count
socket.on('updateStudentLobby', function(data){
    
    var list = document.getElementById('studentsJoined');
    var noOfParticipants = document.getElementById('noOfParticipants');
    list.innerHTML = "";
    noOfParticipants.innerHTML = data.length;
    for(var i = 0; i < data.length; i++){
        var newStudent = document.createElement('li');
        newStudent.innerHTML = data[i].name;
        list.appendChild(newStudent);
    } 
    
});

//Tell server to start game if button is clicked
function startQuiz(){
    socket.emit('startQuiz');
}
function endQuiz(){
    window.location.href = "/";
}

//When server starts the quiz
socket.on('quizStarted', function(id){
    window.location.href="/host/game/" + "?id=" + id;
});

socket.on('noQuizFound', function(){
    alert("No quiz was found with this PIN");
    window.location.href = '../../';//Redirect user to 'join game' page
});

