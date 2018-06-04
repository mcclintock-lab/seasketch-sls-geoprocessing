module.exports = async (geojson, invocationId) => {
  // build bash startup script
  const sh = `
    sudo shutdown -P +${process.env.WORKER_TIMEOUT} &
    # setup logging
    start=$(date +%s)
    export INVOCATION_ID="${invocationId}"
    # set env vars
    export AWS_DEFAULT_REGION="${process.env.S3_REGION}"
    export S3_PATH="${process.env.S3_BUCKET}/${process.env.S3_KEY_PREFIX}${invocationId}"
    ${process.env.FUNCTION_ENV_VAR_DECLARATIONS}
    export WORKER_TIMEOUT=${process.env.WORKER_TIMEOUT}
    # set geojson env var
    read -d '' GEOJSON << EOF
    ${JSON.stringify(geojson)}
    EOF
    . ~/.nvm/nvm.sh
    # do worker script
    ${process.env.WORKER_SH}
    # calculate duration
    end=$(date +%s)
    RUNTIME=$(((end-start)*1000))
    # send results
    export MESSAGE_BODY=$(cat <<EOF
    {
      "results": $RESULTS,
      "duration": $RUNTIME,
      "invocationId": "$INVOCATION_ID"
    }
    EOF
    )
    aws sqs send-message --message-body "$MESSAGE_BODY" --queue-url ${process.env.RESULTS_SQS_ENDPOINT}
    # shutdown
    sudo shutdown now
  `;
  const ami = process.env.WORKER_AMI;
  const workerType = process.env.WORKER_TYPE;
  return {
    sh,
    worker: {
      ami,
      workerId: '123',
      workerType
    }
  }
}
