import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const DYNAMO_DB_TABLE_NAME = "certification-questions";

// cloud-practitioner
const getCertCount = (awsRegion) => {
  return async (req, res) => {
    try {
      const dynamoClient = new DynamoDBClient({ region: awsRegion });
      const docClient = DynamoDBDocumentClient.from(dynamoClient);

      const command = new QueryCommand({
        TableName: DYNAMO_DB_TABLE_NAME,
        KeyConditionExpression: "certification = :cert",
        ExpressionAttributeValues: {
          ":cert": req.certification,
        },
        Select: "COUNT",
      });
      const result = await docClient.send(command);
      res.send("" + result.Count);
    } catch (error) {
      console.error("Error encountered: ", error);
      res.status(500).json({ success: false, message: "Query error" });
    }
  };
};

const getCertQuestion = (awsRegion) => {
  return async (req, res) => {
    try {
      const dynamoClient = new DynamoDBClient({ region: awsRegion });
      const docClient = DynamoDBDocumentClient.from(dynamoClient);

      const command = new QueryCommand({
        TableName: DYNAMO_DB_TABLE_NAME,
        KeyConditionExpression:
          "certification = :cert AND question_number = :qnum",
        ExpressionAttributeValues: {
          ":cert": req.certification,
          ":qnum": req.number,
        },
      });
      const result = await docClient.send(command);
      res.json(result);
    } catch (error) {
      console.error("Error encountered: ", error);
      res.status(500).json({ success: false, message: "Query error" });
    }
  };
};

export default { getCertCount, getCertQuestion };
