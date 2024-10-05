void println(Object o) { System.out.println(o); };

// String-Vergleiche
println("Michael" == "Michael");
println("Michael" == "michael");
println("Michael" != "michael");

// Vergleiche von numerischen Werten
println(1 >= 1);
println(2 >= 1d);
println(2d >= 3l);

// UNGÜLTIG: "Michael" == 1