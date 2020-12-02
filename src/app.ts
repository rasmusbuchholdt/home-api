import { Hue } from './hue';
import { Spotify } from './spotify';

let cors = require("cors");
let express = require("express");
let bodyparser = require("body-parser");
let HTTP = require("http-status-codes");
let compression = require('compression')

let config = require("../config/app.json");
let app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(compression())
app.use(cors());

let spotifyHandler: Spotify = new Spotify();
let hueHandler: Hue = new Hue();

app.use((req: any, resp: any, next: any) => {
  resp.header("Access-Control-Allow-Origin", "*");
  resp.header("Access-Control-Allow-Headers", "X-Requested-With");
  resp.header("Access-Control-Allow-Methods", "GET, POST", "PUT");
  resp.setHeader('content-type', 'application/json; charset=utf-8');
  next();
});

app.set("port", (config.app_port));

app.get("/api/", (req: any, resp: any) => {
  return resp.status(HTTP.OK).json("Hello, World!");
});

app.get("/api/light/toggle", (req: any, resp: any) => {
  hueHandler.toggleLight(2);
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/increase", (req: any, resp: any) => {
  hueHandler.increaseLightBrightness(2);
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/decrease", (req: any, resp: any) => {
  hueHandler.decreaseLightBrightness(2);
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/toggle", (req: any, resp: any) => {
  spotifyHandler.togglePlayPause();
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/next", (req: any, resp: any) => {
  spotifyHandler.next();
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/previous", (req: any, resp: any) => {
  spotifyHandler.previous();
  return resp.status(HTTP.OK).send();
});

app.listen(app.get("port"), () => {
  console.log(`Listening on port ${app.get("port")}`);
});