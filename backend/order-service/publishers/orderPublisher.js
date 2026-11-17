
import amqp from "amqplib";

const QUEUE = "order_notifications";

let connection;
let channel;

const connectRabbitMQ = async () => {
    try {
        let rabbitmqUrl;

        if (process.env.RABBITMQ_USER && process.env.RABBITMQ_PASS) {
            rabbitmqUrl = `amqp://${encodeURIComponent(process.env.RABBITMQ_USER)}:${encodeURIComponent(process.env.RABBITMQ_PASS)}@rabbitmq:5672`;
        } else {
            rabbitmqUrl = process.env.RABBITMQ_URL;
        }

        if (!rabbitmqUrl) {
            throw new Error("RabbitMQ connection URL or credentials are missing");
        }

        connection = await amqp.connect(rabbitmqUrl);

        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE, {
            durable: true
        });

        console.log("Order Service connected to RabbitMQ");

        connection.on("error", (error) => {
            console.error("RabbitMQ connection error:", error.message);
        });

        connection.on("close", () => {
            console.log("RabbitMQ connection closed");
            connection = null;
            channel = null;
        });

    } catch (error) {
        console.error("RabbitMQ connection failed:", error.message);
        throw error;
    }
};

export const publishOrderEvent = async (orderData) => {
    if (!channel) {
        await connectRabbitMQ();
    }

    const event = {
        eventType: "ORDER_CREATED",
        orderId: orderData.orderId,
        email: orderData.email,
        total: orderData.total,
        createdAt: new Date().toISOString()
    };

    channel.sendToQueue(
        QUEUE,
        Buffer.from(JSON.stringify(event)),
        { persistent: true }
    );

    console.log("Order event published:", event.orderId);
};

export default connectRabbitMQ;
