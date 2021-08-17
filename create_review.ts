const jsonfile = require("jsonfile");
const assert = require("assert");

const users = jsonfile.readFileSync("imports/users.json").t_users;
const userMap = new Map<number, string>();
users.forEach((user: any) => {
  userMap.set(user.id, user.name);
});
const userIDtoUserName = (id: number) => {
  return userMap.has(id) ? userMap.get(id) : "Hitchwiki User";
};

assert(userIDtoUserName(1141) == "gadjodilo");
assert(userIDtoUserName(19971) == "Sally Shamas");

const comments = jsonfile.readFileSync("imports/comments.json").t_comments;
const reviews = jsonfile.readFileSync(
  "imports/reviews.json"
).t_points_descriptions;
const ratings = jsonfile.readFileSync("imports/ratings.json").t_ratings;

export interface Review {
  createdByDisplayName: string;
  description: string;
  locationID: string;
  rating: number | null;
  timestamp: number | null;
}
export interface SimpleReview {
  review: string;
  user: string;
  userID: number;
  datetime: string | null;
}

interface Rating {
  id: number;
  fk_user: number;
  fk_point: number;
  rating: number;
  datetime: Date;
  ip: string;
}
// createdByDisplayName "Legacy User"
// description "Low traffic but a good spot to hitch north and south if you happen to have been hiking on Hambledon Hill"
// (string)
// locationID "ZJB39NIkLVHGwSIFnttM"
// rating null
// timestamp null

const getTime = (datetime: string | null): number | null => {
  if (datetime == null) {
    return null;
  }
  return new Date(datetime).getTime();
};

const locationToSimpleReviews = (legacyID: number): SimpleReview[] => {
  const filteredComments: SimpleReview[] = comments
    .filter((comment) => comment.fk_place == legacyID)
    .map((comment) => ({
      review: comment.comment,
      user: userIDtoUserName(comment.fk_user),
      user_id: comment.fk_user,
      datetime: comment.datetime,
    }));
  const filteredReviews: SimpleReview[] = reviews
    .filter((review) => review.fk_point == legacyID)
    .map((review) => ({
      review: review.description,
      user: userIDtoUserName(review.fk_user),
      user_id: review.fk_user,
      datetime: review.datetime,
    }));

  return filteredComments.concat(filteredReviews);
};

const getRating = (userID: number, legacyID: number): number | null => {
  if (userID == null || legacyID == null) return null;
  const searchRating: Rating = ratings.find(
    (rating: Rating) => rating.fk_user == userID && rating.fk_point == legacyID
  );
  if (searchRating) {
    return searchRating.rating;
  } else {
    return null;
  }
};

const locationToReviews = (legacyID: number, locationID: string): Review[] => {
  const completeReviews = locationToSimpleReviews(legacyID);
  return completeReviews.map((review) => ({
    createdByDisplayName: review.user,
    description: review.review,
    locationID: locationID,
    rating: getRating(review.userID, legacyID),
    timestamp: getTime(review.datetime),
  }));
};

assert(locationToSimpleReviews(2410).length == 5);
assert(locationToSimpleReviews(7609).length == 2);
assert(locationToSimpleReviews(3532).length == 13);

export { locationToSimpleReviews, locationToReviews };
