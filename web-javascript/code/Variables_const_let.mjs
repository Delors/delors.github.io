// Der "Scope" von const und let ist auf den umgebenden Block begrenzt.
// Bei const ist eine *Änderung des Wertes nicht möglich*.
const z = "zzz";
// Bei let ist eine *Änderung des Wertes möglich*.
let   y = "yyy";

function logValues() {
  const y = "---";
  console.log(`y=${y}`, `z=${z}`);

}
console.log(`y=${y}`, `z=${z}`);
logValues();
console.log(`y=${y}`, `z=${z}`);