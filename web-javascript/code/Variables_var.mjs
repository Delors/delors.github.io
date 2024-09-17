import { ilog, log, done } from "./log.mjs";

let y = "yyy"; // wie zuvor
const z = "zzz";

// Der Gültigkeitsbereich von var ist die umgebende Funktion oder der
// globale Gültigkeitsbereich.
// Die Definition ist ("hoisted") hochgezogen (initialisiert mit undefined);
// In modernem JavaScript sollte var nicht mehr verwendet werden.
var x = "xxx";

function sumIfDefined(a, b) {
  // ⚠️ Der folgende Code ist NICHT empfehlenswert!
  //    Er dient der Visualisierung des Verhaltens
  //    von var.
  if (parseInt(a)) {
    var result = parseInt(a);
  } else {
    result = 0;
  }
  const bVal = parseFloat(b);
  if (bVal) {
    result += bVal;
  }
  return result;
}

ilog("sumIfDefined()", sumIfDefined()); // 0
ilog("sumIfDefined(1)", sumIfDefined(1)); // 1
ilog("sumIfDefined(1, 2)", sumIfDefined(1, 2)); // 3
ilog('sumIfDefined(1, "2")', sumIfDefined(1, "2")); // 3
ilog("undefined + 2", undefined + 2);
ilog('sumIfDefined(undefined, "2")', sumIfDefined(undefined, "2")); // 2

function global_x() {
  ilog("global_x():", x, y, z);
}

function local_var_x() {
  ilog("local_var_x(): erste Zeile (x)", x);

  var x = 1; // the declaration of var is hoisted, but not the initialization
  let y = 2;
  const z = 3;

  ilog("local_var_x(): letzte Zeile (x, y, z)", x, y, z); // 1 2 3
}

global_x();
local_var_x();

ilog("nach global_x() und local_var_x() - x, y, z:", x, y, z);


// Hier, ist nur die Variablendeklaration (helloExpr) "hoisted", aber nicht
// die Definition. Daher kann die Funktion nicht vorher im Code aufgerufen 
// werden!
try {
  helloExpr();
} catch ({error, message}) {
  log("calling helloExpr() failed:", error, "; message: ", message);
}
var helloExpr = function () {
  log("expr: Hello World!");
};
// ab jetzt funktioniert es
helloExpr(); 

done();
