import { HueHandler } from './hue';
import { HueLightConfig } from './models/hue/light-config';
import { PiholeHandler } from './pihole';
import { SpotifyHandler } from './spotify';
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

let spotifyHandler = new SpotifyHandler();
let hueHandler = new HueHandler();
let piholeHandler = new PiholeHandler();

let spotifyState: string;
let movieMode = false;

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

app.get("/api/moviemode/toggle", (req: any, resp: any) => {
  if (!movieMode) spotifyHandler.pause();
  hueHandler.toggleMovieMode(movieMode);
  movieMode = !movieMode;
  return resp.status(HTTP.OK).send();
});

app.get("/api/pihole/", (req: any, resp: any) => {
  piholeHandler.getSummary().then(summary => {
    return resp.status(HTTP.OK).json(summary);
  });
});

app.get("/api/pihole/toggle", (req: any, resp: any) => {
  piholeHandler.toggle();
  return resp.status(HTTP.OK).send();
});

app.get("/api/lights/", (req: any, resp: any) => {
  hueHandler.getLights().then(lights => {
    return resp.status(HTTP.OK).json(lights);
  });
});

app.get("/api/light/:id", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.getLight(+req.params.id).then(light => {
    return resp.status(HTTP.OK).json(light);
  });
});

app.get("/api/light/:id/toggle", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.toggleLight(+req.params.id);
  return resp.status(HTTP.OK).send();
});

app.post("/api/light/set", (req: any, resp: any) => {
  if (
    !req.body.id ||
    !req.body.enabled ||
    !req.body.rgb ||
    !req.body.saturation ||
    !req.body.brightness
  ) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.setCustomLightState({
    id: req.body.id,
    enabled: req.body.enabled,
    rgb: { R: req.body.rgb.R, G: req.body.rgb.G, B: req.body.rgb.B },
    saturation: req.body.saturation,
    brightness: req.body.brightness
  } as HueLightConfig);
  return resp.status(HTTP.OK).send();
});

app.get("/api/light/:id/brightness/:amount", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  hueHandler.adjustLightBrightness(+req.params.id, +req.params.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/playback", (req: any, resp: any) => {
  spotifyHandler.getPlayback().then(playback => {
    return resp.status(HTTP.OK).json(playback);
  });
});

app.get("/api/spotify/playback/:id/set", (req: any, resp: any) => {
  if (!req.params.id) return resp.status(HTTP.BAD_REQUEST).send();
  spotifyHandler.transferPlayback(req.params.id);
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/devices", (req: any, resp: any) => {
  spotifyHandler.getDevices().then(devices => {
    return resp.status(HTTP.OK).json(devices);
  });
});

app.get("/api/spotify/user", (req: any, resp: any) => {
  spotifyHandler.getUser().then(user => {
    return resp.status(HTTP.OK).json(user);
  });
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

app.get("/api/spotify/volume/adjust/:amount", (req: any, resp: any) => {
  spotifyHandler.adjustVolume(req.params.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/api/spotify/volume/set/:amount", (req: any, resp: any) => {
  spotifyHandler.setVolume(req.params.amount);
  return resp.status(HTTP.OK).send();
});

app.get("/auth/spotify", (req: any, resp: any) => {
  spotifyState = randomString(16);
  resp.redirect(spotifyHandler.getAuthURL(spotifyState));
});

app.get("/auth/spotify/logout", (req: any, resp: any) => {
  spotifyHandler = new SpotifyHandler();
  return resp.redirect(config.spotify_auth_success_uri || "/auth/spotify/success");
});

app.get("/auth/spotify/callback", (req: any, resp: any) => {
  if (req.query.state != spotifyState) return resp.status(HTTP.BAD_REQUEST).send();
  spotifyHandler.getToken(req.query.code).then(tokenResponse => {
    spotifyHandler = new SpotifyHandler(tokenResponse);
    return resp.redirect(config.spotify_auth_success_uri || "/auth/spotify/success");
  });
});

app.get("/auth/spotify/success", (req: any, resp: any) => {
  return resp.status(HTTP.OK).json({ status: "success" });
});

app.listen(app.get("port"), () => {
  console.log(`Listening on port ${app.get("port")}`);
});