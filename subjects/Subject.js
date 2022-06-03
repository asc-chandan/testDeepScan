class Subject {
  observers = [];
  subscribe(observer) {
    this.observers.push(observer);
  }
  unSubscribe(observer) {
    this.observers.filter(observ => observ !== observer);
  }
  notify(value) {
    this.observers.forEach(ob => ob(value));
  }
}
// const subjectObj = new Subject()
export default Subject;