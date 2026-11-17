
import mongoose from "mongoose";

const cakeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true,
            enum: ["Chocolate", "Classic", "Fruit", "Cheesecake"]
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        available: {
            type: Boolean,
            default: true
        },

        imageUrl: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Cake = mongoose.model("Cake", cakeSchema);

export default Cake;
