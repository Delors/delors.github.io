// "express" and "cors" are CommonJS modules, which requires us to use the
// "default import" syntax.
import express from "express";

// Cross-Origin Resource Sharing (CORS); This is required to allow the browser
// using a different domain to load the HTML to make requests to this server.
// I. e., we can use the HTML file from the "web-javascript" project to make
// requests to this server.
import cors from "cors";
const APP_PORT = 5080;

const app = express();

app.get("/users", cors(), function (req, res) {
  res.set("Content-Type", "application/json");
  res.end(`{
        "user1" : {
           "name" : "dingo",
           "password" : "1234",
           "profession" : "chef",
           "id": 1
        },

        "user2" : {
           "name" : "ringo",
           "password" : "asdf",
           "profession" : "boss",
           "id": 3
        }
     }`);
});

app.listen(APP_PORT, function () {
  console.log(`Users App @ http://127.0.0.1:${APP_PORT}`);
});
