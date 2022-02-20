const { ApiGatewayManagementApi, DynamoDB } = require('aws-sdk');

const api = new ApiGatewayManagementApi({ endpoint: process.env.WS_ENDPOINT, region: 'ap-south-1' });
const dynamo = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'ap-south-1' });

const sendMessage = async (ConnectionId, Data) => await api.postToConnection({ ConnectionId, Data }).promise();

exports.handler = async event => {
    const id = event.requestContext.connectionId;
    const TableName = "general-project";
    const appName = "socket-canvas";

    try {
        switch (event.requestContext.routeKey) {
            case "$connect":
                await dynamo.put({ TableName, Item: { "app-name": appName, id } }).promise();
                break;

            case "$disconnect":
                await dynamo.delete({ TableName, Key: { "app-name": appName, id } }).promise();
                break;

            case "draw":
                const connectionData = await dynamo.query({
                    TableName,
                    KeyConditionExpression: "#pt = :pt",
                    ExpressionAttributeNames: {
                        "#pt": "app-name"
                    },
                    ExpressionAttributeValues: {
                        ":pt": appName
                    }
                }).promise();

                await Promise.all(
                    connectionData.Items.map(
                        async ({ id }) => {
                            await sendMessage(
                                id,
                                event.body
                            )
                        }
                    )
                )
                break;

            default:
                break;
        };
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ err: err.message })
        }
    }

    return {
        statusCode: 200
    };
};