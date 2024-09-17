const messages = [];
// The last examples require that "use strict"; is not enabled!

// Die Funktionsdeklaration von "hello" ist "hoisted" und kann hier 
// verwendet werden.
hello("Michael");

function hello(person = "World") {
  // argument with default value
  log(`fun: Hello ${person}!`);
}

waitOnInput();

const helloExpr = function () {
  log("expr: Hello World!");
};

// Arrow Functions
const times3 = (x) => x * 3;
log("times3(5)", times3(5)); // 15
const helloArrow = () => log("arrow: Hello World!");
const helloBigArrow = () => {
  const s = "Hello World!";
  log("arrow: " + s);
  return s;
};

log("Hello World!");
helloExpr();
helloArrow();

var helloXXX = function helloXXX() {
  // *Function expression* mit Name
  // arguments ist ein Arrays-vergleichbares Objekt
  // und enthält die Argumente der Funktion
  log(`Hello: `, ...arguments);
  // Wir könnten hier (und nur hier) helloXXX verwenden, 
  // um die Funktion rekursiv aufzurufen.
};
helloXXX("Michael", "John", "Jane");

waitOnInput();

function sum(...args) {
  // rest parameter
  log("args: " + args);
  log(...args); // we use the spread operator here
  return args.reduce((a, b) => a + b, 0); // function nesting
}
log(sum(1, 2, 3, 4, 5)); // 15
log(sum());

/* Generator Functions */
function* fib() {
  // generator
  let a = 0,
    b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const fibGen = fib();
log(fibGen.next().value); // 0
log(fibGen.next().value); // 1
log(fibGen.next().value); // 1
log(fibGen.next().value); // 2
/* Will cause an infinite loop: for (const i of fib()) console.log(i);
   // 0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 ... */


////////////////////////////////////////////////////////////////////////////////
// Helper functions and functionality for demonstration purposes only;
// not part of this lecture unit!

done();

function log(...args) {
  if (messages.length == 0) messages.push(args);
  else {
    if (messages[messages.length - 1].length > 0) args.unshift("\n");
    messages[messages.length - 1].push(...args);
  }
}

function waitOnInput() {
  log("\nPress Enter to continue...");
  messages.push([]);
}

function done() {
  function printNextMessage() {
    if (messages.length == 0) {
      process.exit();
    }
    const message = messages.shift();
    console.log(...message);
  }

  printNextMessage();
  process.stdin.on("data", printNextMessage);
}
