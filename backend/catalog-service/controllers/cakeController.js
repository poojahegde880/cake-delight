
import Cake from "../models/Cake.js";

// GET ALL CAKES + SEARCH + FILTER
export const getAllCakes = async (req, res) => {
    try {
        const { name, category, maxPrice } = req.query;

        const filter = {};

        // Search by cake name
        if (name) {
            filter.name = { $regex: name, $options: "i" };
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by maximum price
        if (maxPrice) {
            filter.price = { $lte: Number(maxPrice) };
        }

        const cakes = await Cake.find(filter).sort({ createdAt: -1 });

        res.status(200).json(
            cakes.map(cake => ({
                id: cake._id,
                name: cake.name,
                description: cake.description,
                category: cake.category,
                price: cake.price,
                available: cake.available,
                imageUrl: cake.imageUrl
            }))
        );

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// GET CAKE BY ID
export const getCakeById = async (req, res) => {
    try {
        const cake = await Cake.findById(req.params.id);

        if (!cake) {
            return res.status(404).json({
                message: "Cake not found"
            });
        }

        res.status(200).json({
            id: cake._id,
            name: cake.name,
            description: cake.description,
            category: cake.category,
            price: cake.price,
            available: cake.available,
            imageUrl: cake.imageUrl
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
