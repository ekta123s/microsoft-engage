var socket = io();
var questionNum = 1; //Starts at two because question 1 is already present
function updateDatabase() {
  var questions = [];
  var name = document.getElementById("name").value;

  if (name.length == 0) {
    alert("Quiz name cannot be empty");
    return;
  }
  for (var i = 1; i <= questionNum; i++) {
    var question = document.getElementById("q" + i).value;
    var answer1 = document.getElementById(i + "A").value;
    var answer2 = document.getElementById(i + "B").value;
    var answer3 = document.getElementById(i + "C").value;
    var answer4 = document.getElementById(i + "D").value;
    var correct = document.getElementById("correct" + i).value;
    var answers = [answer1, answer2, answer3, answer4];

    var correctOption = getCorrectOption(correct);
    questions.push({
      question: question,
      answers: answers,
      correct: correctOption,
    });
  }

  console.log("trying to create a new quiz");
  console.log("questions : ", questions);
  var quiz = { id: 0, name: name, questions: questions };
  socket.emit("newQuiz", quiz);
}

function createColumn(option, questionNumber) {
  var column = document.createElement("div");
  column.setAttribute("class", "column");
  var field = document.createElement("div");
  field.setAttribute("class", "field");
  var LabelA = document.createElement("label");
  LabelA.setAttribute("class", "label");
  LabelA.innerHTML = "Option " + option;
  var control = document.createElement("div");
  control.setAttribute("class", "control");
  var input1 = document.createElement("input");
  input1.setAttribute("type", "text");
  input1.setAttribute("class", "input");
  input1.setAttribute("placeholder", "Type option A here");
  input1.setAttribute("id", String(questionNumber) + option);
  control.appendChild(input1);
  field.appendChild(LabelA);
  field.appendChild(control);
  column.appendChild(field);
  return column;
}

function addQuestion() {
  questionNum += 1;
  console.log("Question number : " + questionNum);
  var allQuestions = document.getElementById("allQuestions");
  var questionsDiv = document.createElement("div");
  questionsDiv.setAttribute("id", "Ques"+questionNum);
  var newQuestion = document.createElement("div");
  newQuestion.setAttribute("class", "field");

  var questionLabel = document.createElement("label");
  questionLabel.setAttribute("class", "label");
  questionLabel.innerHTML = "Question";
  var controlDiv = document.createElement("div");
  controlDiv.setAttribute("class", "control");
  var input = document.createElement("input");

  input.setAttribute("type", "text");
  input.setAttribute("class", "input");
  input.setAttribute("placeholder", "Type your question here");
  input.setAttribute("id", "q" + questionNum);

  controlDiv.appendChild(input);
  newQuestion.appendChild(questionLabel);
  newQuestion.appendChild(controlDiv);

  questionsDiv.appendChild(newQuestion);

  var columnsAB = document.createElement("div");
  columnsAB.setAttribute("class", "columns");
  var columnA = createColumn("A", questionNum);
  var columnB = createColumn("B", questionNum);
  columnsAB.appendChild(columnA);
  columnsAB.appendChild(columnB);
  questionsDiv.appendChild(columnsAB);

  var columnsCD = document.createElement("div");
  columnsCD.setAttribute("class", "columns");
  var columnC = createColumn("C", questionNum);
  var columnD = createColumn("D", questionNum);
  columnsCD.appendChild(columnC);
  columnsCD.appendChild(columnD);
  questionsDiv.appendChild(columnsCD);

  var fieldDropdown = document.createElement("div");
  fieldDropdown.setAttribute("class", "field");
  var labelDropdown = document.createElement("label");
  labelDropdown.setAttribute("class", "label");
  labelDropdown.innerHTML = "Select the correct option";
  var controlDropdown = document.createElement("div");
  controlDropdown.setAttribute("class", "control");
  var selectDiv = document.createElement("div");
  selectDiv.setAttribute("class", "select");
  var select = document.createElement("select");
  select.setAttribute("id", "correct" + String(questionNum));
  var optionA = document.createElement("option");
  optionA.innerHTML = "A";
  var optionB = document.createElement("option");
  optionB.innerHTML = "B";
  var optionC = document.createElement("option");
  optionC.innerHTML = "C";
  var optionD = document.createElement("option");
  optionD.innerHTML = "D";

  select.appendChild(optionA);
  select.appendChild(optionB);
  select.appendChild(optionC);
  select.appendChild(optionD);

  var delBtn = document.createElement("button");
  delBtn.setAttribute("class", "button is-danger");
  delBtn.setAttribute("onclick", "deleteButton(" + questionNum + ")");
  delBtn.innerHTML = "Delete Question"

  selectDiv.appendChild(select);
  controlDropdown.appendChild(selectDiv);
  fieldDropdown.appendChild(labelDropdown);
  fieldDropdown.appendChild(controlDropdown);
  questionsDiv.appendChild(fieldDropdown);
  questionsDiv.appendChild(delBtn);
  allQuestions.appendChild(questionsDiv);
}

function deleteButton(questionNumber) {
  var questionToDelete = document.getElementById("Ques" + questionNumber);
  questionToDelete.innerHTML = "";

}

//Called when user wants to exit quiz creator

function getCorrectOption(correct) {
  console.log("correctOption", correct);
  if (correct == "A") return 1;
  if (correct == "B") return 2;
  if (correct == "C") return 3;
  if (correct == "D") return 4;
}
function cancelQuiz() {
  if (confirm("Are you sure you want to exit? All work will be DELETED!")) {
    window.location.href = "../";
  }
}

socket.on("startQuizFromCreator", function () {
  window.location.href = "../../create";
});
