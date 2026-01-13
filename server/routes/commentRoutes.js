// /server/routes/commentRoutes.js
const router = require("express").Router();
const {
  getCommentsByNewsId,
  addComment,
  deleteComment,
} = require("../controllers/commentController");
const requireClerkAuth = require("../middleware/requireClerkAuth");

// public
router.get("/:newsId/comments", getCommentsByNewsId);

// auth required
router.post("/:newsId/comments", requireClerkAuth, addComment);
router.delete("/:newsId/comments/:commentId", requireClerkAuth, deleteComment);

module.exports = router;
