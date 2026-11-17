
import mongoose from "mongoose";

const basketSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true
        },

        items: [
            {
                cakeId: {
                    type: String,
                    required: true
                },

                name: {
                    type: String,
                    required: true
                },

                unitPrice: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Basket = mongoose.model("Basket", basketSchema);

export default Basket;
