class LiveQuizes {
    constructor () {
        this.quizes = [];
    }
    addQuiz(pin, teacherId, quizLive, quizData){
        console.log("adding a quiz");
        var quiz = {pin, teacherId, quizLive, quizData};
        this.quizes.push(quiz);
        return quiz;
    }
    removeQuiz(teacherId){
        var quiz = this.getQuiz(teacherId);
        
        if(quiz){
            this.quizes = this.quizes.filter((quiz) => quiz.teacherId !== teacherId);
        }
        return quiz;
    }
    getQuiz(teacherId){
        return this.quizes.filter((quiz) => quiz.teacherId === teacherId)[0]
    }
}

module.exports = {LiveQuizes};