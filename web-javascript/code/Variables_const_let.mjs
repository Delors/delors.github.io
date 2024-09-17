import { ilog, log, done } from "./log.mjs";

// Der "Scope" ist auf den umgebenden Block begrenzt.
// Eine Änderung des Wertes ist möglich.
let y = "yyy";

// Der "Scope" ist auf den umgebenden Block begrenzt.
// Eine Änderung des Wertes ist nicht möglich.
const z = "zzz";

ilog("y, z:", y, z);

function change() {
  log("y, z:", y, z);
  {
    const y = "ohno";
    log("y, z:", y, z);
  }
  return "";
}

ilog('"changed done"', change());

done();
