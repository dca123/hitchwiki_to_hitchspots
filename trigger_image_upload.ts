import firebase from "firebase";
import cliProgress from "cli-progress";

require("firebase/firestore");
const jsonfile = require("jsonfile");
var firebaseConfig = jsonfile.readFileSync(".credentials");

const app = firebase.initializeApp(firebaseConfig);

const firestore = firebase.firestore();
// firestore.useEmulator("0.0.0.0", 8005);

// firebase.functions().useEmulator("localhost", 5001);
const uploadImagesByID = firebase.functions().httpsCallable("uploadImagesByID");
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const generateLocationIDsJSON = async () => {
  const locations = await firestore.collection("locations").get();
  const data = locations.docs.map((location) => location.id);
  jsonfile.writeFileSync(
    "exports/locationIDs.json",
    {
      data: data,
    },
    { flag: "a" }
  );
};

const triggerFunction = async () => {
  const locationIDsCollection: [] = jsonfile.readFileSync(
    "exports/locationIDs.json"
  ).data;
  //2464
  //5031
  const start = 20000,
    end = locationIDsCollection.length;
  bar1.start(end, start);
  for (let index = start; index < end; index++) {
    const locationID = locationIDsCollection[index];
    const location = await firestore
      .collection("locations")
      .doc(locationID)
      .get();

    const locationData = location.data()!;

    if (locationData["hasImages"] === true) {
      bar1.increment();
      continue;
    }
    await uploadImagesByID({ locationID: location.id });
    bar1.increment();
  }
  bar1.stop();
};

// generateLocationIDsJSON();
triggerFunction();
