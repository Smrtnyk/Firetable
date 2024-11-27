#!/bin/bash

# Start the Firebase emulator in the background
firebase emulators:start --only firestore &
EMULATOR_PID=$!

# Wait for emulator to start
sleep 5

# Run the tests
vitest
TEST_EXIT_CODE=$?

# Kill the emulator
kill $EMULATOR_PID

# Exit with the test exit code
exit $TEST_EXIT_CODE
