import OfficeOrigins from "../models/officeorigins.model.js";

// get origins
export const getOrigins = async (req, res) => {
  try {
    const origins = await OfficeOrigins.findOne();

    if (!origins) {
      return res.status(404).json({
        success: false,
        message: "Office origin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: origins.toObject(),
    });
  } catch (error) {
    console.error("Failed:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching office origin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// set origins
export const setOrigins = async (req, res) => {
  try {
    const { adminId, lat, lng } = req.body;

    // Make sure adminId is provided
    if (!adminId || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "adminId, lat, and lng are required",
      });
    }

    const updatedOrigins = await OfficeOrigins.findOneAndUpdate(
      { adminId },
      { $set: { lat, lng } },
      { new: true, upsert: true } // return updated doc and create if not exist
    );

    return res.status(200).json({
      success: true,
      message: "Origins Updated Successfully",
      data: updatedOrigins,
    });
  } catch (error) {
    console.error("Failed:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while updating origins",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
