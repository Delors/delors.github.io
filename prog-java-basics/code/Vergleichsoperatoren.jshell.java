
// String-Vergleiche
IO.println("Michael" == "Michael");
IO.println("Michael" == "michael");
IO.println("Michael" != "michael");
var name = "Michael";
IO.println("Michael" == name);
var enteredName = IO.readln("Name:"); // Enter "Michael"
// enteredName = "Michael"
IO.println(name == enteredName);

// Vergleiche von numerischen Werten
IO.println(1 >= 1);
IO.println(2 >= 1d);
IO.println(2d >= 3l);

// UNGÜLTIG: "Michael" == 1
