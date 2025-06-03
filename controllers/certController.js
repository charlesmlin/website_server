import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import awsClient from "../utils/awsClient.js";
import getRandomNumber from "../utils/pcg32.js";

const DYNAMO_DB_TABLE_NAME = "certification-questions";

const getQuestionCount = async (awsRegion, certification) => {
  const client = awsClient.getDynamoDocClient(awsRegion);
  const command = new QueryCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    KeyConditionExpression: "certification = :cert",
    ExpressionAttributeValues: {
      ":cert": certification,
    },
    Select: "COUNT",
  });
  const result = await client.send(command);
  return result.Count;
};

const getQuestionCountPromise = (awsRegion) => {
  return async (req, res) => {
    try {
      const certCount = await getQuestionCount(
        awsRegion,
        req.params.certification
      );
      res.send("" + certCount);
    } catch (error) {
      console.error("Error encountered: ", error);
      res.status(500).json({ success: false, message: "Query error" });
    }
  };
};

const getQuestion = async (awsRegion, certification, questionNumber) => {
  const client = awsClient.getDynamoDocClient(awsRegion);
  const command = new QueryCommand({
    TableName: DYNAMO_DB_TABLE_NAME,
    KeyConditionExpression: "certification = :cert AND question_number = :qnum",
    ExpressionAttributeValues: {
      ":cert": certification,
      ":qnum": Number(questionNumber),
    },
    Limit: 1,
  });
  const result = await client.send(command);
  return result.Items[0];
};

const getQuestionPromise = (awsRegion) => {
  return async (req, res) => {
    try {
      const item = await getQuestion(
        awsRegion,
        req.params.certification,
        req.params.number
      );
      if (item === undefined) {
        res.status(404).json({ success: false, message: "Record not found" });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error("Error encountered: ", error);
      res.status(500).json({ success: false, message: "Query error" });
    }
  };
};

const getQuestionWithIndexPromise = (awsRegion) => {
  // req.params.id = Unique identification (email or IP) for the user
  // req.params.number = Desired question number
  return async (req, res) => {
    try {
      const userId = req.params.id;
      const certification = req.params.certification;
      const questionRequested = req.params.number;
      const questionCount = await getQuestionCount(awsRegion, certification);
      console.log(`questionCount = ${questionCount}`);
      // Assumption: Question number is numbered sequentially in the database
      const randomNumber = getRandomNumber(
        userId + certification,
        questionRequested
      );
      const questionNumber = (randomNumber % questionCount) + 1;
      console.log(`questionNumber = ${questionNumber}`);
      const item = await getQuestion(awsRegion, certification, questionNumber);
      console.log(`item = ${item}`);
      if (item === undefined) {
        res.status(404).json({ success: false, message: "Record not found" });
        return;
      }
      const keySet = new Set(["question", "options", "answer"]);
      const result = Array.from(item).filter(([key, _]) => keySet.has(key));
      result.question_number = questionRequested;
      result.success = true;
      res.json(result);
    } catch (error) {
      console.error("Error encountered: ", error);
      res.status(500).json({ success: false, message: "Query error" });
    }
  };
};

export default {
  getQuestionCountPromise,
  getQuestionWithIndexPromise,
};
