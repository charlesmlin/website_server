# A script to consolidate all environment variables mentioned in .env, then print out to console in json array format
# This is used to export .env as JSON to be uploaded to Github Actions Secrets

#!/bin/sh

if [ $# -lt 1 ]; then
  echo "Usage: $0 path/to/.env" >&2
  exit 1
fi

ENV_FILE="$1"
if [ ! -f "$ENV_FILE" ]; then
  echo "File not found: $ENV_FILE" >&2
  exit 1
fi

EXCLUDE_KEYS="PORT AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY"
should_exclude() {
  for ex_key in $EXCLUDE_KEYS; do
    if [ "$1" = "$ex_key" ]; then
      return 0
    fi
  done
  return 1
}

output="["

FIRST=1
while IFS= read -r line || [ -n "$line" ]; do
  # Strip leading/trailing whitespace
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  # Skip empty lines and comments
  if [ -z "$line" ] || printf "%s\n" "$line" | grep -qE '^#'; then
    continue
  fi

  # Parse KEY=VALUE
  if printf "%s\n" "$line" | grep -q '='; then
    key=$(printf "%s\n" "$line" | cut -d '=' -f 1)
    value=$(printf "%s\n" "$line" | cut -d '=' -f 2-)

    # Remove excluded keys
    if should_exclude "$key"; then
      continue
    fi

    # Remove surrounding quotes from value if present
    value=$(printf "%s\n" "$value" | sed -E 's/^["'"'"'](.*)["'"'"']$/\1/')

    # Escape double quotes in key and value
    key_escaped=$(printf '%s' "$key" | sed 's/"/\\"/g')
    value_escaped=$(printf '%s' "$value" | sed 's/"/\\"/g')

    if [ $FIRST -eq 0 ]; then
      output="${output}, "
    fi
    FIRST=0

    output="${output}{\"name\":\"$key_escaped\", \"value\":\"$value_escaped\"}"
  fi
done < "$ENV_FILE"

output="${output}]"
echo "$output"
