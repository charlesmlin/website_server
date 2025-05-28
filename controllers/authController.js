import jwt from "jsonwebtoken";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ISSUER_SOURCES = ["https://accounts.google.com", "accounts.google.com"];
const DYNAMO_DB_TABLE_NAME = "website-users";
const DYNAMO_DB_USER_ROLE_INDEX = "provider_provider_id_index";

// Query AWS DynamoDB and return role for given provider and its corresponding id
// To query for user roles from Amazon DynamoDB table using an index, IAM policy "dynamodb:Query" needs to be granted
const getUserRoles = async (awsRegion, provider, providerId) => {
  const dynamoClient = new DynamoDBClient({ region: awsRegion });
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  const command = new QueryCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    IndexName: DYNAMO_DB_USER_ROLE_INDEX,
    KeyConditionExpression:
      "provider = :provider AND provider_id = :provider_id",
    ProjectionExpression: "#r",
    ExpressionAttributeValues: {
      ":provider": provider,
      ":provider_id": providerId,
    },
    ExpressionAttributeNames: {
      "#r": "role",
    },
  });
  const result = await docClient.send(command);
  return result.Items?.map((item) => item.role).filter(Boolean) || [];
};

const generateAppToken = (appSecret, provider, email, name) => {
  return jwt.sign({ provider, email, name }, appSecret, { expiresIn: "4h" });
};

const googleAuthenticate = async (googleClientId, token) => {
  const now = Math.floor(Date.now() / 1000);
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
  );
  if (!response.ok) {
    return { success: false, message: "Authentication failed" };
  }
  const userResponse = await response.json();
  if (userResponse.aud !== googleClientId) {
    return { success: false, message: "ID mismatch" };
  }
  if (!ISSUER_SOURCES.includes(userResponse.iss)) {
    return { success: false, message: "Invalid issuer" };
  }
  if (userResponse.exp < now) {
    return { success: false, message: "Credential has expired" };
  }

  return {
    success: true,
    provider: "google",
    provider_id: userResponse.sub,
    email: userResponse.email,
    name: userResponse.name,
  };
};

const authenticate = (awsRegion, appSecret, googleClientId) => {
  return async (req, res) => {
    try {
      let response;
      if (req.body.type === "google") {
        response = await googleAuthenticate(googleClientId, req.body.token);
      } else {
        res.status(403).json({ success: false, message: "Incorrect type" });
        return;
      }

      if (!response.success) {
        res.status(403).json(response);
        return;
      }
      const userRoles = await getUserRoles(
        awsRegion,
        response.provider,
        response.provider_id
      );
      if (userRoles.length <= 0) {
        res.status(403).json({ success: false, message: "Role not found" });
        return;
      }
      const token = generateAppToken(
        appSecret,
        response.provider,
        response.email,
        response.name
      );
      res.json({
        success: true,
        token,
        email: response.email,
        name: response.name,
        roles: userRoles.join(","),
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Authentication error" });
    }
  };
};

export default authenticate;
