
import dotenv from "dotenv";
dotenv.config();

import amqp from "amqplib";
import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";

const QUEUE = "order_notifications";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

let reconnectTimer = null;
let isConnecting = false;

const getRabbitMQUrl = () => {
    if (process.env.RABBITMQ_USER && process.env.RABBITMQ_PASS) {
        return `amqp://${encodeURIComponent(process.env.RABBITMQ_USER)}:${encodeURIComponent(process.env.RABBITMQ_PASS)}@rabbitmq:5672`;
    }

    if (process.env.RABBITMQ_URL) {
        return process.env.RABBITMQ_URL;
    }

    throw new Error("RabbitMQ connection details are missing");
};

// Schedule automatic reconnection
const scheduleReconnect = () => {
    if (reconnectTimer) return;

    console.log("RabbitMQ reconnecting in 5 seconds...");

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startOrderConsumer();
    }, 5000);
};

// Process order notification
const processOrder = async (msg, channel) => {
    if (!msg) return;

    let event;

    try {
        event = JSON.parse(msg.content.toString());

        console.log("Order Event Received:", event);

        // Save notification as pending
        await Notification.findOneAndUpdate(
            { orderId: event.orderId },
            {
                orderId: event.orderId,
                customerEmail: event.email,
                status: "PENDING",
                message: "Order confirmation email is being processed"
            },
            { upsert: true, returnDocument: "after" }
        );

        // Send confirmation email
        await transporter.sendMail({
            from: `"Cake Delight" <${process.env.EMAIL_USER}>`,
            to: event.email,
            subject: "Your Cake Delight Order is Confirmed!",
            text: `
Hello,

Thank you for ordering from Cake Delight!

Your order has been confirmed successfully.

Order ID: ${event.orderId}
Total Amount: ₹${event.total}

Thank you for choosing Cake Delight!

Warm regards,
Cake Delight Team
            `,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #a05252;">Thank you for ordering from Cake Delight!</h2>
                    <p>Your order has been confirmed successfully.</p>
                    <p><strong>Order ID:</strong> ${event.orderId}</p>
                    <p><strong>Total Amount:</strong> ₹${event.total}</p>
                    <p>Thank you for choosing Cake Delight!</p>
                    <p>Warm regards,<br/>Cake Delight Team</p>
                </div>
            `
        });

        // Update notification status
        await Notification.findOneAndUpdate(
            { orderId: event.orderId },
            {
                status: "SENT",
                message: "Order confirmation email sent successfully"
            }
        );

        console.log("Confirmation email sent to:", event.email);
        console.log("Notification processed:", event.orderId);

        channel.ack(msg);

    } catch (error) {
        console.error("Notification Processing Failed:", error.message);

        if (event?.orderId) {
            try {
                await Notification.findOneAndUpdate(
                    { orderId: event.orderId },
                    {
                        orderId: event.orderId,
                        customerEmail: event.email,
                        status: "FAILED",
                        message: "Failed to send order confirmation email"
                    },
                    { upsert: true, returnDocument: "after" }
                );
            } catch (dbError) {
                console.error("Could not save failure status:", dbError.message);
            }
        }

        // Reject the message without requeueing, as in the original logic
        try {
            channel.nack(msg, false, false);
        } catch (ackError) {
            console.error("Could not reject message:", ackError.message);
        }
    }
};

// Connect and register RabbitMQ consumer
const startOrderConsumer = async () => {
    if (isConnecting) return;

    isConnecting = true;

    try {
        await transporter.verify();
        console.log("Gmail SMTP connected successfully");

        const connection = await amqp.connect(getRabbitMQUrl());

        console.log("RabbitMQ connection established");

        connection.on("error", (error) => {
            console.error("RabbitMQ connection error:", error.message);
        });

        connection.on("close", () => {
            console.log("RabbitMQ connection closed");
            scheduleReconnect();
        });

        const channel = await connection.createChannel();

        channel.on("error", (error) => {
            console.error("RabbitMQ channel error:", error.message);
        });

        channel.on("close", () => {
            console.log("RabbitMQ channel closed");
            scheduleReconnect();
        });

        await channel.assertQueue(QUEUE, { durable: true });

        // Process one message at a time
        await channel.prefetch(1);

        // Wait until RabbitMQ confirms consumer registration
        const consumer = await channel.consume(
            QUEUE,
            (msg) => processOrder(msg, channel),
            { noAck: false }
        );

        console.log("RabbitMQ Consumer Connected");
        console.log("Consumer registered:", consumer.consumerTag);
        console.log(`Waiting for messages in ${QUEUE}...`);

    } catch (error) {
        console.error("Notification Service Startup Failed:", error.message);
        scheduleReconnect();
    } finally {
        isConnecting = false;
    }
};

export default startOrderConsumer;
