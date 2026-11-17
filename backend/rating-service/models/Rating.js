
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
    {
        cakeId: {
            type: String,
            required: true
        },
        stars: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number between 1 and 5"
            }
        }
    },
    {
        timestamps: true
    }
);

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
