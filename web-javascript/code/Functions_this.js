const messages = [];
// The last examples require that "use strict"; is not enabled!

/** Partial function application */

function add(x, y) {
  return x + y;
}

const add2 = add.bind(null, 2); // the "null" is the value of "this"
log(add2(3));

waitOnInput();

/** "this" in functions */
log('"this" in functions:');

function f(c) {
  const that = this;

  function f() {
    return this === that;
  }

  const fExpr = () => {
    return this === that;
  };

  log(" globalThis === that: " + (globalThis === this));
  log(" this === that (function): " + f());
  log(" f.bind({}); this === that (function): " + f.bind({})());
  log(" this === that (function expression): " + fExpr());
}
f();

waitOnInput();

globalThis.x = -1;
this.x = 0;
log(
  "this.x: " + this.x + "(globalThis === this: " + (globalThis === this) + ")",
);

function addToValue(b) {
  return this.x + b;
}
log(addToValue(1));
log(addToValue.call(this, -101));

const obj = { x: 101, addToValue: addToValue };
log("obj.addtoValue(-101): " + obj.addToValue(-101));

const add100 = addToValue.bind({ x: 100 });
log("add100: " + add100(100));

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
