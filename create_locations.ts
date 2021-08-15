import jsonfile from "jsonfile";
import geohash from "ngeohash";
const file = "imports/places.json";
import { Client } from "@googlemaps/google-maps-services-js";
import firebase from "firebase";
require("firebase/firestore");

const client = new Client({});
import cliProgress from "cli-progress";
import { locationToSimpleReviews } from "./create_review";

// createdBy "Hitchwiki user"
// hasImages true
// legacyId 2848
// name "Pont Kitchener Marchand Pont Kitchener Marchand"
// position
//      geohash "u05km8z69"
//      geopoint[45.7516393801734° N, 4.82204854488373° E]
// rating 3
// reviewCount 4

export interface Position {
  geohash: string;
  geopoint: firebase.firestore.GeoPoint;
}

export interface Location {
  name: string;
  createdBy: string;
  legacyId: number;
  rating: number;
  reviewCount: number;
  position: Position;
}

const GeoPoint = firebase.firestore.GeoPoint;
const keys = jsonfile.readFileSync(".keys");
const coordToName = async (lat: number, lon: number) => {
  const result = await client.reverseGeocode({
    params: {
      key: keys.MAPS_API,
      latlng: {
        latitude: lat,
        longitude: lon,
      },
    },
  });

  const possibleAddresses = result.data.results;

  const selectedAddress = possibleAddresses.filter((addressObj) => {
    return addressObj.types.some((type) => {
      return (
        type == "street_address" ||
        type == "route" ||
        type == "intersection" ||
        type == "premise" ||
        type == "natural_feature" ||
        type == "point_of_interest"
      );
    });
  });
  if (selectedAddress.length == 0) {
    console.log(JSON.stringify(possibleAddresses), lat, lon);
    return "Unspecified Name";
  }
  return selectedAddress[0].formatted_address;
};

//Coverts coodrinates to geohash
const coordToGeoHash = (lat: number, lon: number) => {
  return geohash.encode(lat, lon);
};

const users = jsonfile.readFileSync("imports/users.json").t_users;
const userIDtoUserName = (id: string) => {
  const user = users.filter((obj) => obj.id == id);
  if (user.length == 1) return user[0].name;
  return "Hitchwiki User";
};

const places = jsonfile.readFileSync(file).t_points;
const placesLength = Object.keys(places).length;

const results: Location[] = [];
console.log({
  "Total places length": placesLength,
});

async function main() {
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  const locationLength = 10;
  bar1.start(10, 0);
  for (let index = 0; index < locationLength; index++) {
    const location = places[index];
    results.push({
      name: await coordToName(location.lat, location.lon),
      createdBy: userIDtoUserName(location.user),
      legacyId: location.id,
      rating: location.rating,
      reviewCount: location.rating_count,
      position: {
        geohash: coordToGeoHash(location.lat, location.lon),
        geopoint: new GeoPoint(location.lat, location.lon),
      },
    });
    bar1.increment();
  }

  jsonfile.writeFileSync(
    "exports/locations.json",
    {
      data: results,
    },
    { flag: "a" }
  );
  bar1.stop();
  // console.log(results);
}

async function updateRating() {
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  const file = "exports/locations.json";
  const locations: Location[] = jsonfile.readFileSync(file).data;
  bar1.start(locations.length, 0);

  const updatedLocation = locations.map((location) => {
    bar1.increment();
    return {
      ...location,
      reviewCount: locationToSimpleReviews(location.legacyId).length,
    };
  });
  bar1.stop();
  jsonfile.writeFileSync(
    "exports/locations_updated.json",
    {
      data: updatedLocation,
    },
    { flag: "a" }
  );
}
// main();
updateRating();
