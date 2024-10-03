const p = { s : "p" };
const c = Object.create(p);
const gc = Object.create(c); // grandchild (gc)
gc.t = "q";
gc.s = "gc"
console.log(gc.s); // gc
delete gc.s;
console.log(gc.s); // p