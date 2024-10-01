import { ilog, log, done } from "./log.mjs";

// Der "Scope" ist auf den umgebenden Block begrenzt.
// Eine Änderung des Wertes ist möglich.
let y = "yyy";

// Der "Scope" ist auf den umgebenden Block begrenzt.
// Eine Änderung des Wertes ist nicht möglich.
const z = "zzz";

log("y, z:", y, z);

function doIt() {
  const y = "---";
  log("y, z:", y, z);
  return "";
}

ilog('"doIt done"', doIt());
log("y, z:", y, z);

done();
