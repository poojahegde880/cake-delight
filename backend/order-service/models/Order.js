
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },

        customer: {
            name: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            }
        },

        items: [
            {
                cakeId: String,
                name: String,
                unitPrice: Number,
                quantity: Number
            }
        ],

        total: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            default: "CONFIRMED"
        }
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
