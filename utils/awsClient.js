import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Manages connectivity with AWS
const AwsClient = () => {
  const dynamoClientMap = new Map();

  const getDynamoClient = (awsRegion) => {
    if (!dynamoClientMap.has(awsRegion)) {
      const dynamoClient = new DynamoDBClient({ region: awsRegion });
      dynamoClientMap.set(awsRegion, dynamoClient);
    }
    return dynamoClientMap.get(awsRegion);
  };

  const getDynamoDocClient = (awsRegion) => {
    return DynamoDBDocumentClient.from(getDynamoClient(awsRegion));
  };

  return { getDynamoDocClient };
};

const awsClient = AwsClient();
export default awsClient;
