import mongoose from "mongoose";

const officeOriginsSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      default: 33.5537031,
    },
    lng: {
      type: Number,
      default: 73.1023577,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: () => new mongoose.Types.ObjectId("67ffa738bcdea395296a60aa"),
      immutable: true,
      required: true,
    },
  },
  { timestamps: true }
);

const OfficeOrigins = mongoose.model("OfficeOrigins", officeOriginsSchema);

export const ensureOfficeOriginExists = async () => {
  try {
    const count = await OfficeOrigins.countDocuments();
    if (count === 0) {
      await OfficeOrigins.create({
        lat: 33.5537031,
        lng: 73.1023577,
      });
      console.log("✅ Default office origin inserted");
    } else {
      console.log("ℹ️ Office origin already exists");
    }
  } catch (err) {
    console.error("❌ Failed to ensure default Office Origin:", err.message);
  }
};

export default OfficeOrigins;
