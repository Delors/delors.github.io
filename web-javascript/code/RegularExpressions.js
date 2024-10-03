{
  const p = /.*[1-9]+H/; // a regexp
  console.log(p.test("ad13H"));
  console.log(p.test("ad13"));
  console.log(p.test("13H"));
}
{
  const p = /[1-9]+H/g;
  const s = "1H, 2H, 3P, 4C";
  console.log(s.match(p));
  console.log(s.replace(p, "XX"));
}
