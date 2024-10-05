void println(Object o) { System.out.println(o); };

new java.util.Random().nextInt();
final var key = new java.util.Random().nextInt();
println("0".repeat(Integer.numberOfLeadingZeros(key)) + Integer.toBinaryString(key));
final var income = 13423;
println("0".repeat(Integer.numberOfLeadingZeros(income)) + Integer.toBinaryString(income));
final var encryptedIncome = income ^ key;
println("0".repeat(Integer.numberOfLeadingZeros(encryptedIncome)) + Integer.toBinaryString(encryptedIncome));