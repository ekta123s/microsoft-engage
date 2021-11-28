class Students {
    constructor () {
        this.students = [];
    }
    addStudent(teacherId, studentId, name, quizData){
        var student = {teacherId, studentId, name, quizData};
        this.students.push(student);
        return student;
    }
    removeStudent(studentId){
        var student = this.getStudent(studentId);
        
        if(student){
            this.students = this.students.filter((student) => student.studentId !== studentId);
        }
        return student;
    }
    getStudent(studentId){
        return this.students.filter((student) => student.studentId === studentId)[0]
    }
    getStudents(teacherId){
        return this.students.filter((student) => student.teacherId === teacherId);
    }
}

module.exports = {Students};