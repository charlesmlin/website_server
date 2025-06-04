#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 input.json"
  exit 1
fi

INPUT_FILE="$1"
MODEL="gpt-4.1-nano"  # or gpt-4
API_KEY="${OPENAI_API_KEY}"

if [[ -z "$API_KEY" ]]; then
  echo "Error: OPENAI_API_KEY is not set."
  exit 1
fi

ROW_COUNT=1
TARGET_JSON_FORMAT='{"keyPointToTest": ["point1", "point2"], "terminology": [{"termA": "termExplanationA"}], "options": {"A": {"correct": "yes", "reason": "explanationA"}}}'

jq -c '.[]' "$INPUT_FILE" | while read -r question; do
  [[ -z "$question" ]] && continue  # Skip empty lines
  output_file="../openai_response_$ROW_COUNT.jsonl"

  echo "Start working on question $ROW_COUNT"

  # Prepare JSON request payload
  question_formatted="For the question $question, please give the answer in the following JSON format: $TARGET_JSON_FORMAT. Terminology should cover AWS-product mentioned in both questions and options. keyPointToTest should each be a noun phrase start with a gerund. Value in each field should have capitalized first letter."
  request_data=$(jq -n --arg q "$question_formatted" --arg model "$MODEL" \
    '{model: $model, messages: [{role: "user", content: $q}]}')

  # Call OpenAI API
  response=$(curl -s -X POST https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$request_data")

  # Extract content from response
  answer=$(echo "$response" | jq -r '.choices[0].message.content' | sed 's/\\n//g')

  # Format each entry as a JSON object
    jq -n --arg q "$question" --arg a "$answer" \
    '{question: $q, answer: $a}' >> "$output_file"

  echo "Done working on question $ROW_COUNT"

  let ROW_COUNT=ROW_COUNT+1
done
