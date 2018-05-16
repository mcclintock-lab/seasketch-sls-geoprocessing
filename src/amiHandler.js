module.exports = async (geojson, invocationId) => {
  // build bash startup script
  const sh = `
    export INVOCATION_ID=${invocationId}
    # setup logging
    # set env vars
    export S3_PATH=https://s3-${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET}/${process.env.S3_KEY_PREFIX}/${invocationId}
    ${process.env.FUNCTION_ENV_VAR_DECLARATIONS}
    export WORKER_TIMEOUT=${process.env.WORKER_TIMEOUT}
    # set geojson env var
    read -d '' GEOJSON << EOF
    ${JSON.stringify(geojson)}
    EOF
    # do worker script
    ${process.env.WORKER_SH}
    # send results
    aws sqs send-message --message-body $MESSAGE_BODY --queue-url ${process.env.RESULTS_SQS_ENDPOINT}
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
