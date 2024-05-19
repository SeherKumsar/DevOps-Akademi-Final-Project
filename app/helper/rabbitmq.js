const amqp = require('amqplib');

let channel;

async function connectToRabbitMQ() {
    let connection;
    try {
        connection = await amqp.connect('amqp://rabbitmq');
        channel = await connection.createChannel();

        console.log('Successfully connected to RabbitMQ');
    } catch (error) {
        console.error('Error:', error);
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
}

async function sendOrderMessage(order) {
    if (!channel) {
        console.error('Error: RabbitMQ channel is not initialized');
        return;
    }

    const queue = 'orders';
    await channel.assertQueue(queue, { durable: false });

    // Convert the order object to a string and send it to the queue
    const message = JSON.stringify(order);
    channel.sendToQueue(queue, Buffer.from(message));

    console.log(`Sent order message: ${message}`);
}

module.exports = {
    connectToRabbitMQ,
    sendOrderMessage,
};