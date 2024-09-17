"use strict";

try {
  let i = 1 / 0; // Berechnungen erzeugen nie eine Exception
  console.log("i", i);
} catch {
  console.error("division by zero");
} finally {
  console.log("computation finished");
}

try {
  const obj = {};
  obj = { a: 1 };
} catch ({ name, message }) {
  console.error(message);
} finally {
  console.log("object access finished");
}

try {
  throw new RangeError("out of range");
} catch (error) {
  if (error instanceof RangeError) {
    const { name, message } = error;
    console.error("a RangeError:", name, message);
  } else {
    throw error;
  }
} finally {
  console.log("error handling finished");
}
