const mongoose = require("mongoose");
const TestCase = require("../models/TestCase");
const Problem = require("../models/Problem");

// create a test case
const createTestCase = async (req, res) => {
  try {
    const { problemId } = req.params;
    const {
      input,
      expectedOutput,
      isHidden = false,
      points = 1,
      order = 0,
    } = req.body;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem Id",
      });
    }

    if (typeof input !== "string" || typeof expectedOutput !== "string") {
      return res.status(400).json({
        success: false,
        message: "Input and output must be strings",
      });
    }

    if (
      typeof isHidden !== "boolean" ||
      !Number.isFinite(points) ||
      points < 0 ||
      !Number.isInteger(order) ||
      order < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid test configuration",
      });
    }

    const problemExists = await Problem.exists({
      _id: problemId,
    });

    if (!problemExists) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const testCase = await TestCase.create({
      problem: problemId,
      input,
      expectedOutput,
      isHidden,
      points,
      order,
    });

    return res.status(201).json({
      success: true,
      message: "Test case created successfully",
      data: testCase,
    });
  } catch (error) {
    console.error("Create test case error : ", error.message);

    return re.status(500).json({
      success: false,
      message: "failed to create test case",
    });
  }
};

// get all test cases for a problem (admin only)
const getProblemTestCases = async (req, res) => {
  try {
    const { problemId } = req.params;

    if (!mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem Id",
      });
    }

    const problemExists = await Problem.exists({
      _id: problemId,
    });

    if (!problemExists) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const testCases = await TestCase.find({
      problem: problemId,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases,
    });
  } catch (error) {
    console.error("Get test cases error: ", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test cases",
    });
  }
};

// update a test case
const updateTestCase = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test case ID",
      });
    }

    const allowedFields = [
      "input",
      "expectedOutput",
      "isHidden",
      "points",
      "order",
      "isActive",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    if (
      ("input" in updates && typeof updates.input !== "string") ||
      ("expectedOutput" in updates &&
        typeof updates.expectedOutput !== "string") ||
      ("isHidden" in updates && typeof updates.isHidden !== "boolean") ||
      ("isActive" in updates && typeof updates.isActive !== "boolean") ||
      ("points" in updates &&
        (!Number.isFinite(updates.points) || updates.points < 0)) ||
      ("order" in updates &&
        (!Number.isInteger(updates.order) || updates.order < 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more test case fields are invalid",
      });
    }

    const testCase = await TestCase.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        returnDocument:"after",
        runValidators: true,
      },
    );

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test case updated successfully",
      data: testCase,
    });
  } catch (error) {
    console.error("Update test case error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update test case",
    });
  }
};

//delete a test case

const deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test case id",
      });
    }

    const testCase = await TestCase.findByIdAndDelete(id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: "Test case not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "test case deleted successfully",
    });
  } catch (error) {
    console.error("Delete test case error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete test case",
    });
  }
};

module.exports = {
  createTestCase,
  getProblemTestCases,
  updateTestCase,
  deleteTestCase,
};
