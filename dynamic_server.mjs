import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { Canvas } from "skia-canvas";

import { default as express } from "express"; //npm install express;
import { default as sqlite3 } from "sqlite3"; //npm install sqlite3;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8081;
const root = path.join(__dirname, "public");
const template = path.join(__dirname, "templates");
let cities = [];

let app = express();
app.use(express.static(root));

const db = new sqlite3.Database(
  "./data.sqlite3",
  sqlite3.OPEN_READONLY,
  (err) => {
    if (err) {
      console.log("Error connecting to database");
    } else {
      console.log("Sucessfully connected to database");

      //Get list of city names
      db.all("SELECT DISTINCT city FROM Weather", [], (err, rows) => {
        if (err) {
          console.error("DB error");
        } else {
          cities = rows.map((r) => r.city).sort();
          console.log("Loaded cities:", cities);
        }
      });
    }
  }
);

app.get("/", (req, res) => {
  console.log("### homepage");
  let index = null;

  let sendResponse = function () {
    console.log("### sendResponse");
    let temperatureLinks = "";
    let precipitationLinks = "";
    let windLinks = "";
    for (let i = 0; i < cities.length; i++) {
      temperatureLinks += `<li><a href="/temperature/${cities[i]}">${cities[i]}</a></li>`;
      precipitationLinks += `<li><a href="/precipitation/${cities[i]}">${cities[i]}</a></li>`;
      windLinks += `<li><a href="/wind/${cities[i]}">${cities[i]}</a></li>`;
    }
    index = index.replace("$$$ CITIES-TEMPERATURE $$$", temperatureLinks);
    index = index.replace("$$$ CITIES-PRECIPITATION $$$", precipitationLinks);
    index = index.replace("$$$ CITIES-WIND $$$", windLinks);
    res.status(200).type("html").send(index);
  };

  fs.readFile(path.join(template, "index.html"), (err, data) => {
    console.log("### read index html");
    if (err) {
      res.status(404).type("text/plain").send("Error: file not found");
    } else {
      index = data.toString();
      sendResponse();
    }
  });
});

// Erin
app.get("/temperature/:city", (req, res) => {
  console.log("### city " + req.params.city);
  let sql =
    "SELECT year, avg_temp, temp_max, temp_min FROM Weather WHERE city = ?";
  let city = req.params.city;
  let cToF = function (celsius) {
    if (isNaN(celsius)) return celsius;
    else return Math.round((celsius * 1.8 + 32) * 100) / 100;
  };

  db.all(sql, [city], (err, rows) => {
    if (err) {
      res
        .status(404)
        .type("txt")
        .send("Error: " + city + " temperature data not found");
    } else if (!checkValidCity(rows)) {
      sendOopsPage(res, city);
    } else {
      fs.readFile(
        path.join(template, "temperature.html"),
        { encoding: "utf8" },
        (err, data) => {
          if (err) {
            res
              .status(404)
              .type("text/plain")
              .send("Error:" + city + " Temperature not found");
          } else {
            console.log("### read temperature html");

            let temperatureTable = "";
            for (let i = 0; i < rows.length; i++) {
              temperatureTable += "<tr><td>" + rows[i].year + "</td>";
              temperatureTable += "<td>" + cToF(rows[i].avg_temp) + "</td>";
              temperatureTable += "<td>" + cToF(rows[i].temp_min) + "</td>";
              temperatureTable +=
                "<td>" + cToF(rows[i].temp_max) + "</td></tr>";
            }

            // To create graph
            const years = JSON.stringify(rows.map((r) => r.year));
            const ave = JSON.stringify(rows.map((r) => cToF(r.avg_temp)));

            let response = data.replace("$$$CITY$$$", city);
            response = response.replace(
              "$$$TEMPERATURE_TABLE$$$",
              temperatureTable
            );
            response = response.replace("$$$YEARS$$$", years);
            response = response.replace("$$$AVE$$$", ave);

            // Previous and Next city links
            let index = cities.indexOf(city);
            let prevIndex = (index - 1 + cities.length) % cities.length; // wrap around
            let nextIndex = (index + 1) % cities.length;
            response = response.replace("$$$PREV_CITY$$$", cities[prevIndex]);
            response = response.replace("$$$NEXT_CITY$$$", cities[nextIndex]);

            res.status(200).type("html").send(response);
          }
        }
      );
    }
  });
});

// Harrison
app.get("/precipitation/:city", (req, res) => {
  console.log("### city " + req.params.city);
  let sql =
    "SELECT year, precipitation, days_with_rain, days_with_snow FROM Weather WHERE city = ?";
  const city = req.params.city;

  db.all(sql, [city], (err, rows) => {
    if (err) {
      res
        .status(404)
        .type("txt")
        .send("Error: " + city + " wind data not found");
    } else if (!checkValidCity(rows)) {
      sendOopsPage(res, city);
    } else {
      fs.readFile(
        path.join(template, "precipitation.html"),
        { encoding: "utf8" },
        (err, data) => {
          if (err) {
            res
              .status(404)
              .type("text/plain")
              .send("Error:" + city + " Precipitation not found");
          } else {
            console.log("### read precipitation html");

            let precipitationTable = "";
            for (let i = 0; i < rows.length; i++) {
              precipitationTable += "<tr><td>" + rows[i].year + "</td>";
              precipitationTable +=
                "<td>" + rows[i].precipitation + "</td></tr>";
            }

            //To create graph
            const years = JSON.stringify(rows.map((r) => r.year));
            const precipitation = JSON.stringify(
              rows.map((r) => r.precipitation)
            );
            const rain = JSON.stringify(rows.map((r) => r.days_with_rain));
            const snow = JSON.stringify(rows.map((r) => r.days_with_snow));

            let response = data.replace("$$$CITY$$$", city);
            response = response.replace(
              "$$$PRECIPITATION_TABLE$$$",
              precipitationTable
            );
            response = response.replaceAll("$$$YEARS$$$", years);
            response = response.replace("$$$PRECIPITATION$$$", precipitation);
            response = response.replace("$$$RAINDAYS$$$", rain);
            response = response.replace("$$$SNOWDAYS$$$", snow);

            // Previous and Next city links
            let index = cities.indexOf(city);
            let prevIndex = (index - 1 + cities.length) % cities.length; // wrap around
            let nextIndex = (index + 1) % cities.length;
            response = response.replace("$$$PREV_CITY$$$", cities[prevIndex]);
            response = response.replace("$$$NEXT_CITY$$$", cities[nextIndex]);

            res.status(200).type("html").send(response);
          }
        }
      );
    }
  });
});

// Kristina
app.get("/wind/:city", (req, res) => {
  console.log("### city " + req.params.city);
  let sql = "SELECT year, avg_wind_speed FROM Weather WHERE city = ?";
  let city = req.params.city;

  db.all(sql, [city], (err, rows) => {
    if (err) {
      res
        .status(404)
        .type("txt")
        .send("Error: " + city + " wind data not found");
    } else if (!checkValidCity(rows)) {
      sendOopsPage(res, city);
    } else {
      fs.readFile(
        path.join(template, "wind.html"),
        { encoding: "utf8" },
        (err, data) => {
          if (err) {
            res
              .status(404)
              .type("text/plain")
              .send("Error:" + city + " Wind not found");
          } else {
            console.log("### read wind html");

            let windTable = "";
            for (let i = 0; i < rows.length; i++) {
              windTable += "<tr><td>" + rows[i].year + "</td>";
              windTable += "<td>" + rows[i].avg_wind_speed + "</td></tr>";
            }

            //To create graph
            const years = JSON.stringify(rows.map((r) => r.year));
            const speeds = JSON.stringify(rows.map((r) => r.avg_wind_speed));

            let response = data.replace("$$$CITY$$$", city);
            response = response.replace("$$$WIND_TABLE$$$", windTable);
            response = response.replace("$$$YEARS$$$", years);
            response = response.replace("$$$SPEEDS$$$", speeds);

            // Previous and Next city links
            let index = cities.indexOf(city);
            let prevIndex = (index - 1 + cities.length) % cities.length; // wrap around
            let nextIndex = (index + 1) % cities.length;
            response = response.replace("$$$PREV_CITY$$$", cities[prevIndex]);
            response = response.replace("$$$NEXT_CITY$$$", cities[nextIndex]);

            res.status(200).type("html").send(response);
          }
        }
      );
    }
  });
});

function checkValidCity(rows) {
  return rows.length !== 0;
}

function sendOopsPage(res, city) {
  fs.readFile(
    path.join(template, "oops.html"),
    { encoding: "utf-8" },
    (err, data) => {
      if (err) {
        res
          .status(500)
          .type("text/plain")
          .send("Error: could not get oops page.");
      } else {
        console.log("Redirecting to oops page!");
        const response = data.replaceAll("$$$CITY$$$", city);
        res.status(200).type("html").send(response);
      }
    }
  );
}

app.use((req, res) => {
  // redirect user to home page if it's an invalid url
  res.redirect("/");
});

app.listen(port, () => {
  console.log("Now listening on port " + port);
});
