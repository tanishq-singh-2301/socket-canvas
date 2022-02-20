"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// const { ApiGatewayManagementApi, DynamoDB } = require('aws-sdk');
const aws_sdk_1 = require("aws-sdk");
const api = new aws_sdk_1.ApiGatewayManagementApi({ endpoint: process.env.WS_ENDPOINT, region: 'ap-south-1' });
const dynamo = new aws_sdk_1.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: 'ap-south-1' });
const sendMessage = (ConnectionId, Data) => __awaiter(void 0, void 0, void 0, function* () {
    yield api.postToConnection({ ConnectionId, Data }).promise();
});
exports.handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    const id = event.requestContext.connectionId;
    const TableName = "general-project";
    const appName = "socket-canvas";
    try {
        switch (event.requestContext.routeKey) {
            case "$connect":
                yield dynamo.put({ TableName, Item: { "app-name": appName, id } }).promise();
                break;
            case "$disconnect":
                yield dynamo.delete({ TableName, Key: { "app-name": appName, id } }).promise();
                break;
            case "draw":
                const connectionData = yield dynamo.query({
                    TableName,
                    KeyConditionExpression: "#pt = :pt",
                    ExpressionAttributeNames: {
                        "#pt": "app-name"
                    },
                    ExpressionAttributeValues: {
                        ":pt": appName
                    }
                }).promise();
                yield Promise.all(connectionData.Items.map(({ id }) => __awaiter(void 0, void 0, void 0, function* () {
                    yield sendMessage(id, event.body);
                })));
                break;
        }
        ;
    }
    catch (err) {
        if (err instanceof Error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ err: err.message })
            };
        }
    }
    return {
        statusCode: 200
    };
});
