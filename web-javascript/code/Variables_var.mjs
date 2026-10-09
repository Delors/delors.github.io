import { ilog, log, done } from "./log.mjs";

let   y = "yyy"; // wie zuvor
const z = "zzz";

// Der Gültigkeitsbereich von var ist die umgebende Funktion oder der
// globale Gültigkeitsbereich.
// Die Definition ist hochgezogen (eng. "hoisted") (initialisiert mit undefined);
function global_x_y_z() {
  log("global_x_y_z:", x, y, z);
}

log(x);
var   x = "xxx";
log(x);

function sumIfDefined(a, b) {
  // ⚠️ Der folgende Code ist NICHT empfehlenswert!
  //    Er dient der Visualisierung des Verhaltens von var.
  if (parseInt(a)) {
    var result = parseInt(a); // Deklaration von result ist hochgezogen (eng. hoisted)
  } else {
    result = 0;
  }
  const bVal = parseFloat(b);
  if (bVal) result += bVal;
  return result;
}

log("sumIfDefined()", sumIfDefined()); // 0
log("sumIfDefined(1)", sumIfDefined(1)); // 1
log("sumIfDefined(1, 2)", sumIfDefined(1, 2)); // 3

global_x_y_z();

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