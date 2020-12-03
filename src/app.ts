import { Hue } from './hue';
import { HueLightConfig } from './models/hue/light-config';
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

app.get("/api/moviemode", (req: any, resp: any) => {
  config.movie_mode.lights.forEach((lightConfig: HueLightConfig) => {
    hueHandler.setCustomLightState(lightConfig);
  });
  spotifyHandler.pause();
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/:id/toggle", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.toggleLight(+req.params.id);
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/:id/increase/:amount", (req: any, resp: any) => {
  if (!req.params.id || !req.params.amount) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.increaseLightBrightness(+req.params.id, +req.params.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/:id/decrease/:amount", (req: any, resp: any) => {
  if (!req.params.id || !req.params.amount) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.decreaseLightBrightness(+req.params.id, +req.params.amount);
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