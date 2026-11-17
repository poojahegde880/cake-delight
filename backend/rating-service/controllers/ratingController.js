
import Rating from "../models/Rating.js";

// GET RATING SUMMARY FOR A CAKE
export const getRatingSummary = async (req, res) => {
    try {
        const { cakeId } = req.params;

        const result = await Rating.aggregate([
            {
                $match: { cakeId }
            },
            {
                $group: {
                    _id: "$cakeId",
                    average: { $avg: "$stars" },
                    count: { $sum: 1 }
                }
            }
        ]);

        if (result.length === 0) {
            return res.status(200).json({
                average: 0,
                count: 0
            });
        }

        res.status(200).json({
            average: Number(result[0].average.toFixed(1)),
            count: result[0].count
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// SUBMIT A CAKE RATING
export const submitRating = async (req, res) => {
    try {
        const { cakeId, stars } = req.body;

        if (
            !cakeId ||
            !Number.isInteger(stars) ||
            stars < 1 ||
            stars > 5
        ) {
            return res.status(400).json({
                message: "Cake ID and a valid rating between 1 and 5 are required"
            });
        }

        const rating = await Rating.create({
            cakeId,
            stars
        });

        res.status(201).json({
            message: "Rating submitted successfully",
            rating
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
