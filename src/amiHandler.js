module.exports = async (geojson, invocationId) => {
  // build bash startup script
  const tasks = `
set -e
# setup logging
start=$(date +%s)
export INVOCATION_ID="${invocationId}"
# set env vars
export AWS_DEFAULT_REGION="${process.env.S3_REGION}"
export S3_PATH="${process.env.S3_BUCKET}/${process.env.S3_KEY_PREFIX}${invocationId}"
${process.env.FUNCTION_ENV_VAR_KEYS.split(',').map((k) => `export ${k}="${process.env[k]}"`).join("\n")}
export WORKER_TIMEOUT=${process.env.WORKER_TIMEOUT}
export RESULTS_SQS_ENDPOINT="${process.env.RESULTS_SQS_ENDPOINT}"
export LOGS_SQS_ENDPOINT="${process.env.LOGS_SQS_ENDPOINT}"
# set geojson env var
export GEOJSON=$(cat <<EOF
${JSON.stringify(geojson)}
EOF
)
# do worker script
set -x
${process.env.WORKER_SH}
set +x
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
  `;

  const sh = `
sudo shutdown -h -P +${process.env.WORKER_TIMEOUT} &
. ~/.nvm/nvm.sh
npm install -g git+ssh://git@github.com:mcclintock-lab/seasketch-sls-geoprocessing.git
cat >./tasks.sh <<'SSEOL'
${tasks}
SSEOL
run-ami-tasks ./tasks.sh
if [ "$?" -eq "0" ]
then
  echo "Okay"
else
  echo "run-ami-tasks failed. ensure seasketch-sls-api-server is notified"
  export MESSAGE_BODY=$(cat <<EOF
  {
    "message": "invocationId: $INVOCATION_ID run-ami-tasks failed"
  }
  EOF
  )
  aws sqs send-message --message-body "$MESSAGE_BODY" --queue-url "${process.env.LOGS_SQS_ENDPOINT}"
fi
sudo shutdown -c
sudo shutdown -h now
  `

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
};
