#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 input.json"
  exit 1
fi

input_file="$1"
input_filename=$(echo $input_file | xargs basename)

echo "Start working on input file $input_filename"

# Load input JSON
raw_json=$(cat "$input_file")

# Extract question_number by parsing the nested JSON string in "question"
question_number=$(echo "$raw_json" | jq -r '.question | fromjson | .question_number')

if [[ -z "$question_number" || "$question_number" == "null" ]]; then
  echo "Error: Could not extract question_number"
  exit 2
fi

# Extract answer string and remove literal \n characters inside it
# First parse answer as JSON string, then remove \n from it
raw_answer=$(echo "$raw_json" | jq -r '.answer')

# Remove literal newline characters (\n) inside the string (not newlines in shell)
clean_answer=$(echo "$raw_answer" | sed ':a;N;$!ba;s/\\n//g')

# Parse cleaned answer string as JSON and convert to DynamoDB JSON format
dynamodb_answer=$(echo "$clean_answer" | jq -c '
  def to_dynamodb:
    if type == "object" then
      { "M": (to_entries | map({ (.key): (.value | to_dynamodb) }) | add) }
    elif type == "array" then
      { "L": map(to_dynamodb) }
    elif type == "string" then
      { "S": . }
    elif type == "number" then
      { "N": tostring }
    elif type == "boolean" then
      { "BOOL": . }
    elif . == null then
      { "NULL": true }
    else
      error("Unsupported JSON type")
    end;
  to_dynamodb
')

# Build the key JSON
key_json="{\"certification\": {\"S\": \"cloud-practitioner\"}, \"question_number\": {\"N\": \"$question_number\"}}"

# Build expression attribute values for answer (string type)
expr_attr_values="{\":val\": $dynamodb_answer}"

# Update DynamoDB item with answer attribute
aws dynamodb update-item \
  --table-name certification-questions \
  --key "$key_json" \
  --update-expression "SET explanation = :val" \
  --expression-attribute-values "$expr_attr_values"

echo "Done working on input file $input_filename"