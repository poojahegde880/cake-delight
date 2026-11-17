
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import Cake from "./models/Cake.js";

dotenv.config();

const cakes = [
    {
        name: "Chocolate Truffle",
        description: "Rich chocolate cake layered with smooth chocolate ganache.",
        category: "Chocolate",
        price: 650,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
    },
    {
        name: "Black Forest",
        description: "Classic chocolate cake with whipped cream and cherries.",
        category: "Chocolate",
        price: 750,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
    },
    {
        name: "Vanilla Delight",
        description: "Soft vanilla sponge with delicious vanilla cream.",
        category: "Classic",
        price: 450,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600"
    },
    {
        name: "Red Velvet",
        description: "Moist red velvet sponge with cream cheese frosting.",
        category: "Classic",
        price: 850,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600"
    },
    {
        name: "Strawberry Cake",
        description: "Fresh strawberry cake with light whipped cream.",
        category: "Fruit",
        price: 700,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600"
    },
    {
        name: "Mango Paradise",
        description: "Delicious mango-flavoured cake with creamy frosting.",
        category: "Fruit",
        price: 800,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600"
    },
    {
        name: "Blueberry Cheesecake",
        description: "Creamy cheesecake topped with blueberry sauce.",
        category: "Cheesecake",
        price: 950,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600"
    },
    {
        name: "Classic Cheesecake",
        description: "Smooth and creamy baked cheesecake.",
        category: "Cheesecake",
        price: 900,
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600"
    }
];

const seedCakes = async () => {
    try {
        await connectDB();

        for (const cake of cakes) {
            await Cake.findOneAndUpdate(
                { name: cake.name },
                { $set: cake },
                { upsert: true, returnDocument: "after", runValidators: true }
            );
        }

        console.log("Sample cakes added successfully!");
        console.log(`Total sample cakes: ${cakes.length}`);

    } catch (error) {
        console.error("Seeding failed:", error.message);
    } finally {
        await mongoose.connection.close();
    }
};

seedCakes();
