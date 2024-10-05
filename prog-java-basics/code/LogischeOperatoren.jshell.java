void println(Object o) { System.out.println(o); };

int x = 5;
int y = 7;
int n = 0;

println(x == 5 && y == 7);
println(n != 0 && y/n == 1);
println(n != 0 & y/n == 1); // ?!
println(x == 5 && y/x >= 1);

println(x == 5 || y/x >= 0);
println(x == 5 || y/n >= 0);
println(y/n >= 0 || x == 5); // ?!