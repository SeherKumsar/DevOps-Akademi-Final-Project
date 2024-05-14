const amqp = require('amqplib');

async function connectToRabbitMQ() {
    let connection;
    try {
        connection = await amqp.connect('amqp://rabbitmq');
        const channel = await connection.createChannel();

        console.log('Successfully connected to RabbitMQ');

        // Return the channel to the caller
        return channel;
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

module.exports = connectToRabbitMQ;