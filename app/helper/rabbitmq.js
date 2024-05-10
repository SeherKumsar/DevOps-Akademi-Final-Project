const amqp = require('amqplib');

async function connectToRabbitMQ() {
    try {
        const connection = await amqp.connect('amqp://rabbitmq'); // RabbitMQ container'ının adını kullandık
        const channel = await connection.createChannel();

        console.log('Successfully connected to RabbitMQ');

        // Return the channel to the caller
        return channel;
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = connectToRabbitMQ;