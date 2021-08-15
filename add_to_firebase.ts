const firebase = require("firebase");
require("firebase/firestore");
import cliProgress from "cli-progress";
import {
  locationToReviews,
  locationToSimpleReviews,
  Review,
} from "./create_review";
const jsonfile = require("jsonfile");
import { Location } from "./create_locations";
var firebaseConfig = jsonfile.readFileSync(".credentials");

// Initialize Firebase

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const locations = jsonfile.readFileSync("exports/locations.json").data;

async function main() {
  bar1.start(10, 0);
  for (let index = 0; index < 10; index++) {
    const location: Location = locations[index];
    // console.log(reviews);
    // const locationSnapshot = await db
    //   .collection("locations_test")
    //   .where("legacyId", "==", location.legacyId)
    //   .get();

    // if (locationSnapshot.empty) {
    //   //   console.log("SKIP !");
    //   bar1.increment();
    //   continue;
    // }

    const res = await db.collection("locations_test").add({
      ...location,
      position: {
        geohash: location.position.geohash,
        geopoint: new firebase.firestore.GeoPoint(
          location.position.geopoint.latitude,
          location.position.geopoint.longitude
        ),
      },
    });
    const reviews: Review[] = locationToReviews(
      location.legacyId,
      res.id,
      location.rating / location.reviewCount
    );
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      await db.collection("reviews_test").add(review);
    }

    bar1.increment();
  }
  bar1.stop();
}

main();
