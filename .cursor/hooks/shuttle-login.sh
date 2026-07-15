#!/bin/bash
# Shuttle login automation helper
# This script performs automated login to the Shuttle app

set -e

# Read input from stdin (hook JSON)
input=$(cat)

# Extract command if available
command=$(echo "$input" | jq -r '.command // "login"' 2>/dev/null || echo "login")

case "$command" in
  login)
    cat <<'EOF'
{
  "permission": "allow",
  "user_message": "Ready to automate Shuttle login. The agent will:\n1. Navigate to http://localhost:5173/\n2. Fill in username: sumit\n3. Fill in PIN: 1111\n4. Click LOGIN\n5. Wait for authentication\n6. Verify login success",
  "agent_message": "Shuttle login automation ready. Use the shuttle-login skill to execute."
}
EOF
    ;;
  *)
    cat <<'EOF'
{
  "permission": "allow",
  "agent_message": "Unknown command"
}
EOF
    ;;
esac

exit 0
