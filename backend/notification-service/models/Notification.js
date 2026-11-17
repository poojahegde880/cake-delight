
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        customerEmail: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING", "SENT", "FAILED"],
            default: "PENDING"
        },
        message: {
            type: String,
            default: "Order confirmation notification"
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;
