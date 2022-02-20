import { ApiGatewayManagementApi, DynamoDB } from 'aws-sdk';

const api: ApiGatewayManagementApi = new ApiGatewayManagementApi({ endpoint: process.env.WS_ENDPOINT as string, region: 'ap-south-1' });
const dynamo: DynamoDB.DocumentClient = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'ap-south-1' });

const sendMessage: Function = async (ConnectionId: string, Data: string): Promise<void> => {
    await api.postToConnection({ ConnectionId, Data }).promise()
};

exports.handler = async (event: any) => {
    const id: string = event.requestContext.connectionId;
    const TableName: string = "general-project";
    const appName: string = "socket-canvas";

    try {
        switch (event.requestContext.routeKey) {
            case "$connect":
                await dynamo.put({ TableName, Item: { "app-name": appName, id } }).promise();
                break;

            case "$disconnect":
                await dynamo.delete({ TableName, Key: { "app-name": appName, id } }).promise();
                break;

            case "draw":
                const connectionData: any = await dynamo.query({
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
                        async ({ id }: { id: string }) => {
                            await sendMessage(
                                id,
                                event.body
                            )
                        }
                    )
                )
                break;
        };
    } catch (err) {
	if(err instanceof Error){
            return {
                statusCode: 400,
                body: JSON.stringify({ err: err.message })
            }
	}
    }

    return {
        statusCode: 200
    };
};
