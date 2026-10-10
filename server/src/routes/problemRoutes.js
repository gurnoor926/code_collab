const express = require("express");
const {
      getProblems,
    getProblemById,
    createProblem,
    updateProblem,
    deleteProblem,
} = require("../controllers/problemController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

const {
    problemSchema,
    updateProblemSchema
} = require("../schemas/problemSchema");

//public routes
router.get("/",getProblems);
router.get("/:id",getProblemById);

//admin only

router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    validate(problemSchema),
    createProblem
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    validate(updateProblemSchema),
    updateProblem
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteProblem
)

module.exports = router;