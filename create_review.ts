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
  datetime: string;
}
// createdByDisplayName "Legacy User"
// description "Low traffic but a good spot to hitch north and south if you happen to have been hiking on Hambledon Hill"
// (string)
// locationID "ZJB39NIkLVHGwSIFnttM"
// rating null
// timestamp null

const locationToSimpleReviews = (legacyID: number): SimpleReview[] => {
  const filteredComments: SimpleReview[] = comments
    .filter((comment) => comment.fk_place == legacyID)
    .map((comment) => ({
      review: comment.comment,
      user: userIDtoUserName(comment.fk_user),
      datetime: comment.datetime,
    }));
  const filteredReviews: SimpleReview[] = reviews
    .filter((review) => review.fk_point == legacyID)
    .map((review) => ({
      review: review.description,
      user: userIDtoUserName(review.fk_user),
      datetime: review.datetime,
    }));

  return filteredComments.concat(filteredReviews);
};

const locationToReviews = (
  id: number,
  locationID: string,
  averageRating: number
): Review[] => {
  const completeReviews = locationToSimpleReviews(id);
  return completeReviews.map((review) => ({
    createdByDisplayName: review.user,
    description: review.review,
    locationID: locationID,
    rating: averageRating,
    timestamp: new Date(review.datetime).getTime(),
  }));
};

assert(locationToSimpleReviews(2410).length == 5);
assert(locationToSimpleReviews(7609).length == 2);
assert(locationToSimpleReviews(3532).length == 13);

export { locationToSimpleReviews, locationToReviews };
