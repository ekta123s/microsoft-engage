//Import dependencies
const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");

//Import classes
const { LiveQuizes } = require("./utils/liveQuizes");
const { Students } = require("./utils/students");
const publicPath = path.join(__dirname, "../public");
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var quizes = new LiveQuizes();
var students = new Students();

//Mongodb setup
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

app.use(express.static(publicPath));

const PORT = process.env.PORT || 3000;

//Starting server on port PORT
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

//When a connection to server is made from client
io.on("connection", (socket) => {
  //When teacher connects for the first time
  console.log("connected to serverrrr");

  socket.on("teacher-join", (data) => {
    console.log("teacher joined");

    //Check to see if id passed in url corresponds to id of online quiz in database
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("QuizDB");
      var query = { id: parseInt(data.id) };
      dbo
        .collection("quizes")
        .find(query)
        .toArray(function (err, result) {
          if (err) throw err;

          //A quiz was found with the id passed in url
          if (result[0] !== undefined) {
            var quizPin = Math.floor(Math.random() * 90000) + 10000; //new pin for quiz

            quizes.addQuiz(quizPin, socket.id, false, {
              studentsAnswered: 0,
              questionLive: false,
              quizid: data.id,
              question: 1,
            }); //Creates a quiz with pin and teacher id

            var quiz = quizes.getQuiz(socket.id); //Gets the quiz data

            socket.join(quiz.pin); //The teacher is joining a room based on the pin

            console.log("quiz Created with pin:", quiz.pin);

            //Sending quiz pin to teacher so they can display it for students to join
            socket.emit("showQuizPin", {
              pin: quiz.pin,
            });
          } else {
            socket.emit("noQuizFound");
          }
          db.close();
        });
    });
  });

  //When the teacher connects from the quiz view
  socket.on("teacher-join-quiz", (data) => {
    console.log("teacher joined quiz");
    var oldTeacherId = data.id;
    var quiz = quizes.getQuiz(oldTeacherId); //Gets quiz with old teacher id
    console.log("this quiz", quiz);
    if (quiz) {
      quiz.teacherId = socket.id; //Changes the quiz teacher id to new teacher id
      socket.join(quiz.pin);
      var studentData = students.getStudents(oldTeacherId); //Gets student in quiz
      for (var i = 0; i < Object.keys(students.students).length; i++) {
        if (students.students[i].teacherId == oldTeacherId) {
          students.students[i].teacherId = socket.id;
        }
      }
      var quizid = quiz.quizData["quizid"];
      MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        var dbo = db.db("QuizDB");
        var query = { id: parseInt(quizid) };
        dbo
          .collection("quizes")
          .find(query)
          .toArray(function (err, res) {
            if (err) throw err;

            var question = res[0].questions[0].question;
            var answer1 = res[0].questions[0].answers[0];
            var answer2 = res[0].questions[0].answers[1];
            var answer3 = res[0].questions[0].answers[2];
            var answer4 = res[0].questions[0].answers[3];
            var correctAnswer = res[0].questions[0].correct;

            socket.emit("quizQuestions", {
              q1: question,
              a1: answer1,
              a2: answer2,
              a3: answer3,
              a4: answer4,
              correct: correctAnswer,
              studentsInQuiz: studentData.length,
            });
            db.close();
          });
      });

      io.to(quiz.pin).emit("quizStartedStudent");
      quiz.quizData.questionLive = true;
    } else {
      socket.emit("noQuizFound"); //No quiz was found, redirect user
    }
  });

  //When student connects for the first time
  socket.on("student-join", (params) => {
    console.log("student joined");
    var quizFound = false; //If a quiz is found with pin provided by teacher

    //For each quiz in the quizes class
    for (var i = 0; i < quizes.quizes.length; i++) {
      //If the pin is equal to one of the quiz's pin
      if (params.pin == quizes.quizes[i].pin) {
        console.log("Student connected to quiz");

        var teacherId = quizes.quizes[i].teacherId; //Get the id of teacher of quiz

        students.addStudent(teacherId, socket.id, params.name, {
          score: 0,
          answer: 0,
        }); //add student to quiz

        socket.join(params.pin); //student is joining room based on pin

        var allStudentsInLobby = students.getStudents(teacherId); //Getting all students in quiz

        io.to(params.pin).emit("updateStudentLobby", allStudentsInLobby); //Sending teacher, student data to display
        quizFound = true; //quiz has been found
      }
    }

    //If the quiz has not been found
    if (quizFound == false) {
      socket.emit("noQuizFound"); // Student is sent back to 'join' page because quiz was not found with pin
    }
  });

  //When the student connects from quiz view
  socket.on("student-join-quiz",(data) => {
    var student = students.getStudent(data.id);
    if (student) {
      var quiz = quizes.getQuiz(student.teacherId);
      var currentQuestion = quiz.quizData.question;
      var quizid = quiz.quizData.quizid;
      MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        var dbo = db.db("QuizDB");
        var query = { id: parseInt(quizid) };
        var questionData;

        dbo
          .collection("quizes")
          .find(query)
          .toArray(function (err, res) {
            if (err) throw err;
            console.log("res", res);
            questionData = res[0].questions[currentQuestion - 1];
            console.log("Ques : ", questionData);
            socket.join(quiz.pin);
            student.studentId = socket.id; //Update student id with socket id

            var studentData = students.getStudents(quiz.teacherId);
            var data = {
              studentData: studentData,
              questionData: questionData,
            };
            socket.emit("studentQuizData", data);
          });
      });
    } else {
      socket.emit("noQuizFound"); //No student found
    }
  });

  //When a teacher or student leaves the site
  socket.on("disconnect", () => {
    console.log("disconnected");
    var quiz = quizes.getQuiz(socket.id); //Finding quiz with socket.id
    //If a quiz hosted by that id is found, the socket disconnected is a teacher
    if (quiz) {
      console.log("host disconnected");
      //Checking to see if teacher was disconnected or was sent to quiz view
      if (quiz.quizLive == false) {
        quizes.removeQuiz(socket.id); //Remove the quiz from quizes class
        console.log("Quiz ended with pin:", quiz.pin);

        var studentsToRemove = students.getStudents(quiz.teacherId); //Getting all students in the quiz

        //For each student in the quiz
        for (var i = 0; i < studentsToRemove.length; i++) {
          students.removeStudent(studentsToRemove[i].studentId); //Removing each student from student class
        }

        io.to(quiz.pin).emit("teacherDisconnect"); //Send student back to 'join' screen
        socket.leave(quiz.pin); //Socket is leaving room
      }
    } else {
      console.log("student disconnected");
      //No quiz has been found, so it is a student socket that has disconnected
      var student = students.getStudent(socket.id); //Getting student with socket.id
      //If a student has been found with that id
      if (student) {
        var teacherId = student.teacherId; //Gets id of teacher of the quiz
        var quiz = quizes.getQuiz(teacherId); //Gets quiz data with teacherId
        var pin = quiz.pin; //Gets the pin of the quiz

        if (quiz.quizLive == false) {
          students.removeStudent(socket.id); //Removes student from students class
          var Q = students.getStudents(teacherId); //Gets remaining students in quiz

          io.to(pin).emit("updateStudentLobby", Q); //Sends data to teacher to update screen
          socket.leave(pin); //student is leaving the room
        }
      }
    }
  });

  //Sets data in student class to answer from student
  socket.on("studentAnswer", function (num) {
    console.log("Student answered");
    var student = students.getStudent(socket.id);
    console.log(
      "Student answered a question : " +
        student.name +
        " with studentdId: " +
        student.studentId
    );

    var teacherId = student.teacherId;
    var studentNum = students.getStudents(teacherId);
    var quiz = quizes.getQuiz(teacherId);
    if (quiz.quizData.questionLive == true) {
      //if the question is still live
      student.quizData.answer = num;
      quiz.quizData.studentsAnswered += 1;

      var quizQuestion = quiz.quizData.question;
      var quizid = quiz.quizData.quizid;

      MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        var dbo = db.db("QuizDB");
        var query = { id: parseInt(quizid) };
        dbo
          .collection("quizes")
          .find(query)
          .toArray(function (err, res) {
            if (err) throw err;
            var correctAnswer = res[0].questions[quizQuestion - 1].correct;
            //Checks student answer with correct answer
            if (num == correctAnswer) {
              student.quizData.score += 100;
              io.to(quiz.pin).emit("getTime", socket.id);
              socket.emit("answerResult", true);
            }

            //Checks if all students answered
            if (quiz.quizData.studentsAnswered == studentNum.length) {
              quiz.quizData.questionLive = false; //Question has been ended bc students all answered under time
              var studentData = students.getStudents(quiz.teacherId);
              io.to(quiz.pin).emit("questionOver", studentData, correctAnswer); //Tell everyone that question is over
            } else {
              //update teacher screen of num students answered

              io.to(quiz.pin).emit("updateStudentsAnswered", {
                studentsInQuiz: studentNum.length,
                studentsAnswered: quiz.quizData.studentsAnswered,
              });
            }

            db.close();
          });
      });
    }
  });

  socket.on("getScore", function () {
    var student = students.getStudent(socket.id);
    socket.emit("newScore", student.quizData.score);
  });

  socket.on("time", function (data) {
    var time = data.time / 20;
    time = time * 100;
    var studentId = data.studentId;
    var student = students.getStudent(studentId);
    student.quizData.score += time;
  });

  socket.on("timeUp", function () {
    var quiz = quizes.getQuiz(socket.id);
    quiz.quizData.questionLive = false;
    var studentData = students.getStudents(quiz.teacherId);

    var quizQuestion = quiz.quizData.question;
    var quizid = quiz.quizData.quizid;

    MongoClient.connect(url, function (err, db) {
      if (err) throw err;

      var dbo = db.db("QuizDB");
      var query = { id: parseInt(quizid) };
      dbo
        .collection("quizes")
        .find(query)
        .toArray(function (err, res) {
          if (err) throw err;
          var correctAnswer = res[0].questions[quizQuestion - 1].correct;
          io.to(quiz.pin).emit("questionOver", studentData, correctAnswer);

          db.close();
        });
    });
  });

  socket.on("nextQuestion", function () {
    var studentData = students.getStudents(socket.id);
    //Reset students current answer to 0
    for (var i = 0; i < Object.keys(students.students).length; i++) {
      if (students.students[i].teacherId == socket.id) {
        students.students[i].quizData.answer = 0;
      }
    }

    var quiz = quizes.getQuiz(socket.id);
    quiz.quizData.studentsAnswered = 0;
    quiz.quizData.questionLive = true;
    quiz.quizData.question += 1;
    var quizid = quiz.quizData.quizid;

    MongoClient.connect(url, function (err, db) {
      if (err) throw err;

      var dbo = db.db("QuizDB");
      var query = { id: parseInt(quizid) };
      dbo
        .collection("quizes")
        .find(query)
        .toArray(function (err, res) {
          if (err) throw err;

          // If quiz is not over
          if (res[0].questions.length >= quiz.quizData.question) {
            var questionNum = quiz.quizData.question;
            questionNum = questionNum - 1;
            var question = res[0].questions[questionNum].question;
            var answer1 = res[0].questions[questionNum].answers[0];
            var answer2 = res[0].questions[questionNum].answers[1];
            var answer3 = res[0].questions[questionNum].answers[2];
            var answer4 = res[0].questions[questionNum].answers[3];
            var correctAnswer = res[0].questions[questionNum].correct;
            var questionData = res[0].questions[questionNum];

            socket.emit("quizQuestions", {
              q1: question,
              a1: answer1,
              a2: answer2,
              a3: answer3,
              a4: answer4,
              correct: correctAnswer,
              studentsInQuiz: studentData.length,
            });

            var data = { 
              "questionData" :  questionData,
              "studentData" : studentData
            }

            io.to(quiz.pin).emit("studentQuizData", data);
            db.close();
          } else {
            var studentsInQuiz = students.getStudents(quiz.teacherId);

            // Sort the students on the basis of there final score
            var finalScores = [];
            for(var i = 0;i < studentsInQuiz.length;i++) {
              var studentScore = {
                "name" : studentsInQuiz[i].name,
                "score" : studentsInQuiz[i].quizData.score,
              }

              finalScores.push(studentScore);
            }

            finalScores.sort((a,b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0));
            for(var i = 0; i < finalScores.length; i++) {
              console.log(finalScores[i]);
            }

            finalScores.reverse();

            io.to(quiz.pin).emit("quizOver", finalScores);
          }
        });
    });

    io.to(quiz.pin).emit("nextQuestionStudent");
  });

  //When the teacher starts the quiz
  socket.on("startQuiz", () => {
    var quiz = quizes.getQuiz(socket.id); //Get the quiz based on socket.id
    quiz.quizLive = true;
    socket.emit("quizStarted", quiz.teacherId); //Tell student and teacher that quiz has started
  });

  //Give user quiz names data
  socket.on("requestDbNames", function () {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;

      var dbo = db.db("QuizDB");
      dbo
        .collection("quizes")
        .find()
        .toArray(function (err, res) {
          if (err) throw err;
          socket.emit("quizNamesData", res);
          db.close();
        });
    });
  });

  socket.on("newQuiz", function (data) {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("QuizDB");
      dbo
        .collection("quizes")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;
          var num = Object.keys(result).length;
          if (num == 0) {
            data.id = 1;
            num = 1;
          } else {
            data.id = result[num - 1].id + 1;
          }
          var quiz = data;
          dbo.collection("quizes").insertOne(quiz, function (err, res) {
            if (err) throw err;
            db.close();
          });
          db.close();
          socket.emit("startQuizFromCreator");
        });
    });
  });
});
