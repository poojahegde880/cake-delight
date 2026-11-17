
import axios from "axios";

import Basket from "../models/Basket.js";
import Order from "../models/Order.js";
import { publishOrderEvent } from "../publishers/orderPublisher.js";

const CATALOG_URL = () => process.env.CATALOG_SERVICE_URL;


// GET BASKET
export const getBasket = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        let basket = await Basket.findOne({ userId });

        if (!basket) {
            basket = await Basket.create({
                userId,
                items: []
            });
        }

        const total = basket.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        res.status(200).json({
            items: basket.items,
            total
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ADD ITEM TO BASKET
export const addToBasket = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { cakeId, quantity = 1 } = req.body;

        if (!userId || !cakeId || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Valid user ID, cake ID and quantity are required"
            });
        }

        const response = await axios.get(
            `${CATALOG_URL()}/catalog/cakes/${cakeId}`
        );

        const cake = response.data;

        if (!cake.available) {
            return res.status(400).json({
                message: "Cake is currently unavailable"
            });
        }

        let basket = await Basket.findOne({ userId });

        if (!basket) {
            basket = new Basket({
                userId,
                items: []
            });
        }

        const existingItem = basket.items.find(
            item => item.cakeId === cakeId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            basket.items.push({
                cakeId,
                name: cake.name,
                unitPrice: cake.price,
                quantity
            });
        }

        await basket.save();

        const total = basket.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        res.status(200).json({
            items: basket.items,
            total
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE ITEM QUANTITY
export const updateBasketItem = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { cakeId } = req.params;
        const { quantity } = req.body;

        if (!userId || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Valid user ID and quantity are required"
            });
        }

        const basket = await Basket.findOne({ userId });

        if (!basket) {
            return res.status(404).json({
                message: "Basket not found"
            });
        }

        const item = basket.items.find(
            item => item.cakeId === cakeId
        );

        if (!item) {
            return res.status(404).json({
                message: "Item not found in basket"
            });
        }

        item.quantity = quantity;

        await basket.save();

        const total = basket.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        res.status(200).json({
            items: basket.items,
            total
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// REMOVE ITEM FROM BASKET
export const removeBasketItem = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { cakeId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        const basket = await Basket.findOne({ userId });

        if (!basket) {
            return res.status(404).json({
                message: "Basket not found"
            });
        }

        basket.items = basket.items.filter(
            item => item.cakeId !== cakeId
        );

        await basket.save();

        const total = basket.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        res.status(200).json({
            items: basket.items,
            total
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// CHECKOUT
export const checkout = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const { name, email, phone, address } = req.body;

        if (!userId || !name || !email || !phone || !address) {
            return res.status(400).json({
                message: "All customer details are required"
            });
        }

        const basket = await Basket.findOne({ userId });

        if (!basket || basket.items.length === 0) {
            return res.status(400).json({
                message: "Basket is empty"
            });
        }

        // Verify current prices and availability
        for (const item of basket.items) {
            const response = await axios.get(
                `${CATALOG_URL()}/catalog/cakes/${item.cakeId}`
            );

            const cake = response.data;

            if (!cake.available) {
                return res.status(400).json({
                    message: `${cake.name} is unavailable`
                });
            }

            item.name = cake.name;
            item.unitPrice = cake.price;
        }

        const total = basket.items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        // Create order in MongoDB
        const order = await Order.create({
            userId,
            customer: {
                name,
                email,
                phone,
                address
            },
            items: basket.items,
            total,
            status: "CONFIRMED"
        });

        // Clear basket after successful order creation
        basket.items = [];
        await basket.save();

        // Publish ORDER_CREATED event to RabbitMQ
        try {
            await publishOrderEvent({
                orderId: order._id.toString(),
                email: order.customer.email,
                total: order.total
            });

            console.log("ORDER_CREATED event published successfully");

        } catch (error) {
            console.error(
                "Order created, but RabbitMQ event publishing failed:",
                error.message
            );
        }

        // Send checkout response
        res.status(201).json({
            orderId: order._id,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
