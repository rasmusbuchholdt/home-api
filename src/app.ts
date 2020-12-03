import { Hue } from './hue';
import { HueLightConfig } from './models/hue/light-config';
import { Spotify } from './spotify';
import { randomString } from './utils';

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

let spotifyState: string;

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

app.get("/api/light/:id/brightness/:amount", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.adjustLightBrightness(+req.params.id, +req.params.amount);
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

app.get("/api/spotify/volume/increase/:amount", (req: any, resp: any) => {
  spotifyHandler.volumeUp(req.params.id.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/volume/decrease/:amount", (req: any, resp: any) => {
  spotifyHandler.volumeDown(req.params.id.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/auth/spotify", (req: any, resp: any) => {
  spotifyState = randomString(16);
  resp.redirect(spotifyHandler.getAuthURL(spotifyState));
});

app.get("/auth/spotify/callback", (req: any, resp: any) => {
  if (req.query.state != spotifyState) return resp.status(HTTP.BAD_REQUEST).send();
  spotifyHandler.getToken(req.query.code).then(tokenResponse => {
    spotifyHandler = new Spotify(tokenResponse);
    return resp.redirect(config.spotify_auth_success_uri || "/auth/spotify/success");
  });
});

app.get("/auth/spotify/success", (req: any, resp: any) => {
  return resp.status(HTTP.OK).json({ status: "success" });
});

app.listen(app.get("port"), () => {
  console.log(`Listening on port ${app.get("port")}`);
});