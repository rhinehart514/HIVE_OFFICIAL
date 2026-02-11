#!/bin/bash
# Trigger event sync locally
curl -s http://localhost:3000/api/cron/sync-events?key=${CRON_SECRET:-dev} | jq .
