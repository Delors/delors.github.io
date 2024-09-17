import {log as show, ilog as log, done} from "./log.mjs";

// Gleichheit       ==      // mit Typumwandlung (auch bei <, >, <=, >=)
// Ungleichheit     !==
// strikt gleich    ===     // ohne Typumwandlung
// strikt ungleich  !===

log('1 == "1": ', 1 == "1");
log('1 === "1": ', 1 === "1");
log("1.0 == 1: ", 1 == 1.0);
log("1 === 1n: ", 1 === 1n);
log('1 < "1"', 1 < "1");
log('0 < "1"', 0 < "1");
log('0 < "0"', 0 < "0");

log('"asdf" === "as" + "df"', "asdf" === "as" + "df");

log("null === NaN: ", null === NaN);
log("null == NaN: ", null == NaN);
log("null === null: ", null === null);
log("null == null: ", null == null);
log("undefined === undefined: ", undefined === undefined);
log("undefined == undefined: ", undefined == undefined);
log("null === undefined: ", null === undefined);
log("null == undefined: ", null == undefined);

const a1 = [1, 2, 3];
const a2 = [1, 2, 3];
log("const a1 = [1, 2, 3]; a1 == [1,2,3]: ", a1 == [1, 2, 3]);
log("const a1 = [1, 2, 3]; a1 == a1: ", a1 == a1);
log("const a1 = [1, 2, 3]; a1 === a1: ", a1 === a1);
log("const a1 = [1, 2, 3]; const a2 = [1, 2, 3]; a1 === a2: ", a1 === a2);
log("const a1 = [1, 2, 3]; const a2 = [1, 2, 3]; a1 == a2: ", a1 == a2);
log(
  "flatEquals(a1,a2):",
  a1.length == a2.length && a1.every((v, i) => v === a2[i]),
);



let firstJohn = { person: "John" };
show('let firstJohn = { person: "John" };');
let secondJohn = { person: "John" };
show('let secondJohn = { person: "John" };');
let basedOnFirstJohn = Object.create(firstJohn);
show("let basedOnFirstJohn = Object.create(firstJohn)");
log("firstJohn == firstJohn: ", firstJohn == firstJohn);
log("firstJohn === secondJohn: ", firstJohn === secondJohn);
log("firstJohn == secondJohn: ", firstJohn == secondJohn);
log("firstJohn === basedOnFirstJohn: ", firstJohn === basedOnFirstJohn);
log("firstJohn == basedOnFirstJohn: ", firstJohn == basedOnFirstJohn);


let sym1 = Symbol("1"); // a unique and immutable primitive value
log(sym1, sym1, "===", sym1 === sym1); // true
let sym2 = Symbol("1");
let objValues = { sym1: "value1", sym2: "value2" };
log('let objValues = { sym1: "value1", sym2: "value2" };');
let obj2Values = { [sym1]: "value1", [sym2]: "value2" };
log(objValues, " === ", obj2Values, " vs. ", objValues === obj2Values);
let obj1Value = { [sym1]: "value1", [sym1]: "value2" };
log(obj2Values, " vs. ", obj1Value);
log(sym1, sym2, "===", sym1 === sym2); // false
log(sym1, sym2, "==", sym1 == sym2); // false
log(Symbol.for("1"), sym1, "==", Symbol.for("1") === sym1);

{
  const obj = {
    name: "John",
    age: 30,
    city: "Berlin",
  };
  log("\nTyptests und Feststellung des Typs:");
  log("typeof obj", typeof obj);
  log("obj instanceof Object", obj instanceof Object);
  log("obj instanceof Array", obj instanceof Array);
}
{
  const obj = { a: "lkj" };
  const obj2 = Object.create(obj);
  log(obj2 instanceof obj.constructor);
}

log("\n?-Operator and Truthy and Falsy Values:");
log('""', "" ? "is truthy" : "is falsy");
log("f()", (() => {}) ? "is truthy" : "is falsy");
log("Array ", Array ? "is truthy" : "is falsy");
log("obj ", {} ? "is truthy" : "is falsy");
log("undefined ", undefined ? "is truthy" : "is falsy");
log("null ", null ? "is truthy" : "is falsy");
log("0", 0 ? "is truthy" : "is falsy");
log("1", 1 ? "is truthy" : "is falsy");

done();
