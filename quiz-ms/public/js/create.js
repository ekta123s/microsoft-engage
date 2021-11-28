var socket = io();
socket.on('connect', function(){
    socket.emit('requestDbNames'); //Get database names to display to user
});

socket.on('quizNamesData', function(data){
    for(var i = 0; i < Object.keys(data).length; i++){
        var tablebody = document.getElementById('game-list');
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        
        var a = document.createElement('a');
        a.innerHTML = data[i].name;
        a.setAttribute('href', "/host/?id="+data[i].id)
        td.appendChild(a);
        tr.appendChild(td);
        tablebody.appendChild(tr);
    }
});