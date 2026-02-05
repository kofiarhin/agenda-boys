// /server/routes/commentRoutes.js
const router = require("express").Router();
const {
  getCommentsByNewsId,
  addComment,
  deleteComment,
  toggleUpvote,
  reportComment,
  pinComment,
} = require("../controllers/commentController");
const requireClerkAuth = require("../middleware/requireClerkAuth");
const requireAdmin = require("../middleware/requireAdmin");

// public
router.get("/:newsId/comments", getCommentsByNewsId);

// auth required
router.post("/:newsId/comments", requireClerkAuth, addComment);
router.delete("/:newsId/comments/:commentId", requireClerkAuth, deleteComment);
router.post(
  "/:newsId/comments/:commentId/upvote",
  requireClerkAuth,
  toggleUpvote
);
router.post(
  "/:newsId/comments/:commentId/report",
  requireClerkAuth,
  reportComment
);
router.patch(
  "/:newsId/comments/:commentId/pin",
  requireClerkAuth,
  requireAdmin,
  pinComment
);

module.exports = router;
