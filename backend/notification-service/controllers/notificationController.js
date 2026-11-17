
import Notification from "../models/Notification.js";

// GET NOTIFICATION STATUS
export const getNotificationStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const notification = await Notification.findOne({ orderId });

        if (!notification) {
            return res.status(200).json({
                status: "PENDING"
            });
        }

        res.status(200).json({
            status: notification.status
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
