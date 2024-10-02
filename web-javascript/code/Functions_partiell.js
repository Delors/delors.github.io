function add(x, y) {
  return x + y;
}

// Partial function application:
const add2 = add.bind(null, 2); // "null" is the value of "this"
console.log(add2(3));


function addToValue(b) {
  return this.x + b;
}
console.log(addToValue.call({x : 0}, -101));
